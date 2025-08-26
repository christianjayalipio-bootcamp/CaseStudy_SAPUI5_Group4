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
            // Attach to route pattern to get parameter
            var oRouter = UIComponent.getRouterFor(this);
            oRouter.getRoute("RouteDetailsOrder").attachPatternMatched(this._onObjectMatched, this);
        },
    onInit: function () {
      const oRouter = UIComponent.getRouterFor(this);
      oRouter.getRoute("RouteDetailsOrder").attachPatternMatched(this._onRouteMatched, this);
    },

    _onRouteMatched: function (oEvent) {
      const sOrderPath = decodeURIComponent(oEvent.getParameter("arguments").orderPath);
      this._sOrderPath = sOrderPath; // store for edit navigation

      const oView = this.getView();
      const oModel = oView.getModel("ordersModel");

      // Bind the view to the selected order
      oView.bindElement({
        path: "/" + sOrderPath,
        model: "ordersModel"
      });

      // Get the selected OrderNumber
      const sOrderNumber = oModel.getProperty("/" + sOrderPath + "/OrderNumber");
      const aOrderProducts = oModel.getProperty("/OrderProducts") || [];
      const aProducts = oModel.getProperty("/Products") || [];

      // Filter and enrich products for this order
      const aMatchedProducts = aOrderProducts
        .filter(op => op.OrderNumber === sOrderNumber)
        .map(op => {
          const oProduct = aProducts.find(p => p.ProductID === op.ProductID) || {};
          return {
            ProductName: oProduct.ProductName || op.ProductID,
            Quantity: op.Quantity,
            PricePerUnit: oProduct.PricePerUnit?.toFixed(2) || "0.00",
            TotalPrice: op.TotalPrice?.toFixed(2) || "0.00"
          };
        });

      // Set local model for product table
      const oProductsModel = new JSONModel(aMatchedProducts);
      oView.setModel(oProductsModel, "orderProductsModel");
    },

    onCancelPress: function () {
      const oRouter = UIComponent.getRouterFor(this);
      oRouter.navTo("RouteMainView");
    },

        _onObjectMatched: function (oEvent) {
            var sOrderPath = decodeURIComponent(oEvent.getParameter("arguments").orderPath);

            this.getView().bindElement({
                path: "/" + sOrderPath,
                events: {
                    dataRequested: function () {
                        this.getView().setBusy(true);
                    }.bind(this),
                    dataReceived: function () {
                        this.getView().setBusy(false);

                        // Attach updateFinished after data is received
                        var oTable = this.byId("detailpanel");
                        if (oTable) {
                            oTable.attachUpdateFinished(this.updateProductTitle.bind(this));
                        }
                    }.bind(this)
                }
            });
        },

        updateProductTitle: function () {
            var oTable = this.byId("detailpanel");
            var iItemCount = oTable.getItems().length;

            var oPanel = this.byId("detail"); // This is the Panel wrapping the table
            if (oPanel) {
                oPanel.setHeaderText("Products (" + iItemCount + ")");
            }
        },

        onEditPress: function () {
            var oRouter = UIComponent.getRouterFor(this);
            var sOrderId = this.getView().getBindingContext().getProperty("OrderID");
            oRouter.navTo("RouteEditOrder", {
                orderId: sOrderId
            });
        },

        onCancelPress: function () {
            var oRouter = UIComponent.getRouterFor(this);
            oRouter.navTo("RouteMainView");
        }
    });
    onEditPress: function () {
      const oRouter = UIComponent.getRouterFor(this);
      oRouter.navTo("RouteEditOrder", {
        orderPath: encodeURIComponent(this._sOrderPath)
      });
    }

  });
});