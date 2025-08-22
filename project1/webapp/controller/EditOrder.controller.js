sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/m/MessageBox"

], function (Controller, UIComponent, MessageBox) {
    "use strict";

    return Controller.extend("com.ui5.trng.project1.controller.EditOrder", {

        onInit: function () {

        },
        onSavePress: function () {
            var that = this;
            MessageBox.confirm("Are you sure you want to Save these changes?", {
                title: "Confirm Save",
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.YES) {
                        that._updateOrder();
                    }
                }
            });
        },
        _navigateToDetails: function (sOrderNumber) {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteDetailsOrder", {
                orderPath: sOrderNumber
            });
        }



    });
});
