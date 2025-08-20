sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent"
], function (Controller, UIComponent) {
    "use strict";

    return Controller.extend("com.ui5.trng.project1.controller.DetailsOrder", {

        onInit: function () {
            var oRouter = UIComponent.getRouterFor(this);
            oRouter.getRoute("RouteDetailsOrder").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            var sPath = decodeURIComponent(oEvent.getParameter("arguments").orderPath);
            var oModel = this.getOwnerComponent().getModel();

            this.getView().setModel(oModel, "order");
            this.getView().bindElement({
                path: sPath,
                model: "order"
            });

            // Store the path for reuse in Edit navigation
            this._sOrderPath = sPath;
        },

        onCancelPress: function () {
            var oRouter = UIComponent.getRouterFor(this);
            oRouter.navTo("RouteMainView"); // Ensure this matches your manifest.json
        },

        onEditPress: function () {
            var oRouter = UIComponent.getRouterFor(this);
            oRouter.navTo("RouteEditOrder");
        }

    });
});