sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "com/ui5/trng/project1/controller/formatter"
], function (Controller, UIComponent, formatter) {
    "use strict";

    return Controller.extend("com.ui5.trng.project1.controller.DetailsOrder", {

        formatter: formatter,  // make formatters available in XML

        onInit: function () {
            // Attach route matched handler
            const oRouter = UIComponent.getRouterFor(this);
            oRouter.getRoute("RouteDetailsOrder").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            const sOrderPath = decodeURIComponent(oEvent.getParameter("arguments").orderPath);
            const oView = this.getView();
            const oModel = oView.getModel("ordersModel");

            // Bind the view to the selected order
            oView.bindElement({
                path: "/" + sOrderPath,
                model: "ordersModel"
            });

            // Get the selected OrderNumber
            const sOrderNumber = oModel.getProperty("/" + sOrderPath + "/OrderNumber");

            // Filter OrderProducts for this order
            const oProductsTable = oView.byId("productsTable");
            if (oProductsTable) {
                const oBinding = oProductsTable.getBinding("items");
                if (oBinding) {
                    oBinding.filter([
                        new sap.ui.model.Filter("OrderNumber", sap.ui.model.FilterOperator.EQ, sOrderNumber)
                    ]);
                }
            }
        },

        /**
         * Navigate back to the main view
         */
        onCancelPress: function () {
            const oRouter = UIComponent.getRouterFor(this);
            oRouter.navTo("RouteMainView");
        },

        /**
         * Navigate to the edit view for the selected order
         */
        onEditPress: function () {
            const oRouter = UIComponent.getRouterFor(this);
            oRouter.navTo("RouteEditOrder", {
                orderPath: this._sOrderPath
            });
        }

    });
});
