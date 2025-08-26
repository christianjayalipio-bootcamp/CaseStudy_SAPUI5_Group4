sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "com/ui5/trng/project1/controller/formatter",
    "sap/m/MessageBox"
], function (Controller, UIComponent, formatter, MessageBox) {
    "use strict";

    return Controller.extend("com.ui5.trng.project1.controller.EditOrder", {

        formatter: formatter,

        onInit: function () {
            var oRouter = UIComponent.getRouterFor(this);
            oRouter.getRoute("RouteEditOrder").attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched: function (oEvent) {
            var sOrderId = oEvent.getParameter("arguments").orderId;

            // Bind the whole view to the selected order
            var sPath = "/Orders(" + sOrderId + ")"; // wrap sOrderId with quotes if it's string
            this.getView().bindElement({
                path: sPath,
                parameters: {
                    expand: "Products"
                }
            });
        },

        _navigateToDetails: function (sOrderNumber) {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteDetailsOrder", {
                orderId: sOrderNumber
            });
        },

        onCancelPress: function () {
            var that = this;
            MessageBox.confirm("Are you sure you want to cancel the changes done in the page?", {
                title: "Confirm Cancel",
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.YES) {
                        var oHistory = sap.ui.core.routing.History.getInstance();
                        var sPreviousHash = oHistory.getPreviousHash();

                        if (sPreviousHash !== undefined) {
                            window.history.go(-1);
                        } else {
                            var sOrderId = that.getView().getBindingContext().getProperty("OrderID");
                            UIComponent.getRouterFor(that).navTo("RouteDetailsOrder", {
                                orderId: sOrderId
                            });
                        }
                    }

                }
            });
        },

        // onSavePress: function () {
        //     var that = this;
        //     MessageBox.confirm("Are you sure you want to Save these changes?", {
        //         title: "Confirm Save",
        //         actions: [MessageBox.Action.YES, MessageBox.Action.NO],
        //         onClose: function (oAction) {
        //             if (oAction === MessageBox.Action.YES) {
        //                 // Put the update code here

        //                 var sOrderNumber = that.getView().getBindingContext().getProperty("OrderID");
        //                 MessageBox.success("The Order " + sOrderNumber + " has been successfully updated.", {
        //                     title: "Update Successful",
        //                     onClose: function () {
        //                         that.getOwnerComponent().getRouter().navTo("RouteDetailsOrder", {
        //                             orderPath: sOrderNumber
        //                         });
        //                     }
        //                 });
        //             }
        //         }
        //     });
        // }


    });
});
