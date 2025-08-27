sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/UIComponent",
  "sap/ui/model/json/JSONModel"
], function (Controller, UIComponent, JSONModel) {
  "use strict";

  return Controller.extend("com.ui5.trng.project1.controller.MainView", {

    onInit: function () {
      // Use the shared ordersModel from Component.js
      const oOrdersModel = this.getOwnerComponent().getModel("ordersModel");
      this.getView().setModel(oOrdersModel, "ordersModel");
    },

    // Navigates to the CreateOrder view
    onPressAdd: function () {
      const oRouter = UIComponent.getRouterFor(this);
      oRouter.navTo("RouteCreateOrder");
    },

  });
});