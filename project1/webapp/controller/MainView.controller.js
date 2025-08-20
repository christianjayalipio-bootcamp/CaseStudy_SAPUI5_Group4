sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "com/ui5/trng/project1/controller/formatter"
], function (Controller, UIComponent, formatter) {
    "use strict";

    return Controller.extend("com.ui5.trng.project1.controller.MainView", {
        
        // Make formatter available in XML bindings
        formatter: formatter,

        /**
         * Navigate to DetailsOrder when a row is pressed
         * @param {sap.ui.base.Event} oEvent
         */
        onPressDetails: function (oEvent) {
            var oRouter = UIComponent.getRouterFor(this);

            var oItem = oEvent.getSource();
            var oContext = oItem.getBindingContext();

            if (!oContext) {
                console.error("No binding context found for the selected row.");
                return;
            }

            var sPath = oContext.getPath(); 
            oRouter.navTo("RouteDetailsOrder", {
                orderPath: encodeURIComponent(sPath)
            });
        },

        onPressAdd: function () {
            var oRouter = UIComponent.getRouterFor(this);
            oRouter.navTo("RouteCreateOrder");
        }

    });
});
