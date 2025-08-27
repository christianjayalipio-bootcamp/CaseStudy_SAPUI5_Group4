sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/UIComponent",
  "sap/ui/model/json/JSONModel",
  "com/ui5/trng/project1/controller/formatter"
], function (Controller, UIComponent, JSONModel, formatter) {
  "use strict";

  return Controller.extend("com.ui5.trng.project1.controller.DetailsOrder", {

    formatter: formatter,

    onInit: function () {
      const oRouter = UIComponent.getRouterFor(this);
      oRouter.getRoute("RouteDetailsOrder").attachPatternMatched(this._onRouteMatched, this);
    },

    _onRouteMatched: function (oEvent) {
      const sOrderPath = decodeURIComponent(oEvent.getParameter("arguments").orderPath);
      this._sOrderPath = sOrderPath;

      const oView = this.getView();
      const oModel = oView.getModel("ordersModel");

      oView.bindElement({
        path: "/" + sOrderPath,
        model: "ordersModel"
      });

      const sOrderNumber = oModel.getProperty("/" + sOrderPath + "/OrderNumber");
      const aOrderProducts = oModel.getProperty("/OrderProducts") || [];
      const aProducts = oModel.getProperty("/Products") || [];

      const aMatchedProducts = aOrderProducts
        .filter(op => op.OrderNumber === sOrderNumber)
        .map(op => {
          const oProduct = aProducts.find(p => p.ProductID === op.ProductID) || {};
          const fPricePerUnit = parseFloat(oProduct.PricePerUnit) || 0;
          const fQuantity = parseFloat(op.Quantity) || 0;
          const fTotalPrice = fPricePerUnit * fQuantity;

          return {
            ProductName: oProduct.ProductName || op.ProductID,
            Quantity: fQuantity,
            PricePerUnit: fPricePerUnit.toFixed(2),
            TotalPrice: fTotalPrice.toFixed(2)
          };
        });

      // Set product model
      const oProductsModel = new JSONModel(aMatchedProducts);
      oView.setModel(oProductsModel, "orderProductsModel");

      // Calculate grand total
      const fGrandTotal = aMatchedProducts.reduce((sum, item) => sum + parseFloat(item.TotalPrice), 0);
      const oSummaryModel = new JSONModel({ GrandTotal: fGrandTotal.toFixed(2) });
      oView.setModel(oSummaryModel, "summaryModel");

      // Attach updateFinished to count items
      const oTable = this.byId("productsTable");
      if (oTable) {
        oTable.attachUpdateFinished(this.updateProductTitle.bind(this));
      }
    },

    updateProductTitle: function () {
      const oTable = this.byId("productsTable");
      const iItemCount = oTable.getItems().length;

      const oPanel = this.byId("panel3");
      if (oPanel) {
        oPanel.setHeaderText("Products (" + iItemCount + ")");
      }
    },

    onEditPress: function () {
      const oRouter = UIComponent.getRouterFor(this);
      oRouter.navTo("RouteEditOrder", {
        orderPath: encodeURIComponent(this._sOrderPath)
      });
    },

    onCancelPress: function () {
      const oRouter = UIComponent.getRouterFor(this);
      oRouter.navTo("RouteMainView");
    }
  });
});