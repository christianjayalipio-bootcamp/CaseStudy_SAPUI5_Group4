sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "com/ui5/trng/project1/controller/formatter"
], function (Controller, UIComponent, Filter, FilterOperator, formatter) {
    "use strict";

    return Controller.extend("com.ui5.trng.project1.controller.DetailsOrder", {

        formatter: formatter,

        onInit: function () {
            var oRouter = UIComponent.getRouterFor(this);
            oRouter.getRoute("RouteDetailsOrder").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            var sOrderID = oEvent.getParameter("arguments").orderId;
            var oModel = this.getOwnerComponent().getModel();

            var sOrderPath;
            if (/^\d+$/.test(sOrderID)) {
                sOrderPath = "/Orders(" + sOrderID + ")";
            } else {
                sOrderPath = "/Orders('" + sOrderID + "')";
            }

            this.getView().bindElement({
                path: sOrderPath,
                model: undefined
            });

            var oProductsTable = this.getView().byId("productTable");
            if (oProductsTable) {
                var oBinding = oProductsTable.getBinding("items");
                if (oBinding) {
                    var oFilter = new Filter("OrderID", FilterOperator.EQ, sOrderID);
                    oBinding.filter([oFilter]);
                }
            }

            this._sOrderPath = sOrderPath;
        },

        onCancelPress: function () {
            var oRouter = UIComponent.getRouterFor(this);
            oRouter.navTo("RouteMainView");
        },

        onEditPress: function () {
            var oRouter = UIComponent.getRouterFor(this);
            var sOrderID = this._sOrderPath.replace("/Orders(", "").replace(")", "").replace(/'/g, "");
            oRouter.navTo("RouteEditOrder", {
                orderId: sOrderID
            });
        }

    });
});
