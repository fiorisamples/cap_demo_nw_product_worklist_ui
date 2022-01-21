sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "../model/formatter"
], function (BaseController, JSONModel, History, formatter) {
    "use strict";
    var that = this;
    return BaseController.extend("capdemonwproductworklistui.controller.Object", {

        formatter: formatter,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        /**
         * Called when the worklist controller is instantiated.
         * @public
         */
        onInit: function () {
            // Model used to manipulate control states. The chosen values make sure,
            // detail page shows busy indication immediately so there is no break in
            // between the busy indication for loading the view's meta data
            this.oViewModel = new JSONModel({
                busy: true,
                delay: 0
            });
            this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
            this.setModel(this.oViewModel, "objectView");
        },
        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */


        /**
         * Event handler  for navigating back.
         * It there is a history entry we go one step back in the browser history
         * If not, it will replace the current entry of the browser history with the worklist route.
         * @public
         */
        onNavBack: function () {
            var sPreviousHash = History.getInstance().getPreviousHash();
            if (sPreviousHash !== undefined) {
                // eslint-disable-next-line sap-no-history-manipulation
                history.go(-1);
            } else {
                this.getRouter().navTo("worklist", {}, true);
            }
        },

        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

        /**
         * Binds the view to the object path.
         * @function
         * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
         * @private
         */
        _onObjectMatched: function (oEvent) {
            that = this;
            this.orderTableId = this.getView().byId("idOrderTable");
            this.oOrderModel = new JSONModel();

            this.oOrderModel.setData({
                Order_Details: []
            });
            var sObjectId = oEvent.getParameter("arguments").objectId;
            this._bindView("/Products" + sObjectId);

        },

        /**
         * Binds the view to the object path.
         * @function
         * @param {string} sObjectPath path to the object to be bound
         * @private
         */
        _bindView: function (sObjectPath) {
            var sCategoryPath = sObjectPath + "/Category",
                sOrderPath = sObjectPath + "/Order_Details",
                sSupplierPath = sObjectPath + "/Supplier";

            this.oModel = this.getView().getModel();

            this.oViewModel.setProperty("/busy", true);
            Promise.all([this._readEntity(sCategoryPath),
            this._readEntity(sOrderPath),
            this._readEntity(sSupplierPath),
            this._readEntity(sObjectPath)
            ]).then(
                that._buildlist.bind(that),
                that._handlelistError.bind(that)
            );
        },


        /**
         * Read the bind Entity data 
         * @function
         * @param {string} sPath path to bind the read
         * @private
         */
        _readEntity: function (sPath) {
            var that = this;
            return new Promise(
                function (resolve, reject) {
                    that.oModel.read(sPath, {
                        success: function (oData) {
                            resolve(oData);
                        }, error: function (oError) {
                            reject(oError)
                        }
                    });
                }
            );
        },

        _buildlist: function (oData) {
            that.oViewModel.setProperty("/busy", false);
            that.oViewModel.setProperty("/Category", oData[0]);
            var sImage  = "data:image/png;base64," + oData[0].Picture;
            that.oViewModel.setProperty("/Image", sImage);
            that.oViewModel.setProperty("/Supplier", oData[2]);
            
            that.oViewModel.setProperty("/Products",oData[3]);

            that.oOrderModel.setData({
                Order_Details: oData[1].results
            });
            that.orderTableId.setModel(that.oOrderModel);
 
        },

        _handlelistError: function (oError) {
            this.oViewModel.setProperty("/busy", false);
            MessageToast.show("Server not responed");
        },



        // _onBindingChange: function () {
        //     var oView = this.getView(),
        //         oViewModel = this.getModel("objectView"),
        //         oElementBinding = oView.getElementBinding();

        //     // No data for the binding
        //     if (!oElementBinding.getBoundContext()) {
        //         this.getRouter().getTargets().display("objectNotFound");
        //         return;
        //     }

        //     var oResourceBundle = this.getResourceBundle(),
        //         oObject = oView.getBindingContext().getObject(),
        //         sObjectId = oObject.ProductName,
        //         sObjectName = oObject.Products;

        //     oViewModel.setProperty("/busy", false);
        //     // oViewModel.setProperty("/shareSendEmailSubject",
        //     //     oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
        //     //         oViewModel.setProperty("/shareSendEmailMessage",
        //     //             oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
        // }
    });

});
