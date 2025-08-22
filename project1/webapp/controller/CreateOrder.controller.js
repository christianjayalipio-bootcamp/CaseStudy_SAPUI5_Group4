sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel"
], function (Controller, UIComponent, JSONModel) {
    "use strict";
 
    return Controller.extend("com.ui5.trng.project1.controller.CreateOrder", {
 
        onInit: function () {
            const oModel = new JSONModel();
 
            // ✅ Use relative path (no leading slash) so it works in deployed apps
            oModel.loadData("/localService/mainService/data/Orders.json");
 
            oModel.attachRequestCompleted(() => {
                const orders = oModel.getData() || [];
 
                // ✅ Flatten orders + products in one step
                const flatData = orders.flatMap(order =>
                    order.Products.map(product => ({
                        ProductName: product.ProductName,
                        Quantity: product.Quantity,
                        PricePerQuantity: product.PricePerQuantity,
                        TotalPrice: product.Quantity * product.PricePerQuantity
                    }))
                );
 
                // ✅ Set flattened data to named model "flat"
                this.getView().setModel(new JSONModel({ Orders: flatData }), "flat");
            });
        },
 
        onPressCancel: function () {
        var oRouter = UIComponent.getRouterFor(this);
        oRouter.navTo("RouteMainView");
        }
    });
});