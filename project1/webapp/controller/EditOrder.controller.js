sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent"
], function (Controller, UIComponent, MessageBox) {
    "use strict";

    return Controller.extend("com.ui5.trng.project1.controller.EditOrder", {
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

        onCancelPress: function () {
            UIComponent.getRouterFor(this).navTo("RouteDetailsOrder", {
                orderId: this.getView().getBindingContext().getProperty("OrderID")
            });
        }
    });
});
