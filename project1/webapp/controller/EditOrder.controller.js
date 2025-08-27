sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/UIComponent",
  "com/ui5/trng/project1/controller/formatter"
], function(Controller, UIComponent, formatter) {
  "use strict";

  return Controller.extend("com.ui5.trng.project1.controller.EditOrder", {
    formatter: formatter,

    onInit: function () {
      const oRouter = UIComponent.getRouterFor(this);
      oRouter.getRoute("RouteEditOrder").attachPatternMatched(this._onRouteMatched, this);
    },

    _onRouteMatched: function (oEvent) {
      const sOrderPath = decodeURIComponent(oEvent.getParameter("arguments").orderPath);
      this._sOrderPath = sOrderPath; // keep for navigation back later

      this.getView().bindElement({
        path: "/" + sOrderPath,
        model: "ordersModel"
      });
    },

    onCancelPress: function () {
      const oRouter = UIComponent.getRouterFor(this);
      oRouter.navTo("RouteDetailsOrder", {
        orderPath: encodeURIComponent(this._sOrderPath)
      });
    }
  });
});
