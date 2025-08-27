sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/UIComponent",
  "sap/ui/model/json/JSONModel",
  "com/ui5/trng/project1/controller/formatter",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/model/Sorter",
  "sap/m/MessageToast",
  "sap/m/MessageBox"
], function (Controller, UIComponent, JSONModel, formatter, Filter, FilterOperator, Sorter, MessageToast, MessageBox) {
  "use strict";

  return Controller.extend("com.ui5.trng.project1.controller.MainView", {

    formatter: formatter,

    updateTitleCount: function () {
      const oTable = this.byId("orderTable");
      const oTitle = this.byId("itemCounter");
      const oBinding = oTable.getBinding("items");
      if (oBinding) {
        const iCount = oBinding.getLength();
        oTitle.setText(`Orders (${iCount})`);
      } else {
        oTitle.setText("Orders (0)");
      }
    },

    onInit: function () {
      const oOrdersModel = this.getOwnerComponent().getModel("ordersModel");
      this.getView().setModel(oOrdersModel, "ordersModel");

      const oTable = this.byId("orderTable");
      oTable.attachUpdateFinished(this.updateTitleCount.bind(this));

      this.updateTitleCount();
    },

    onGoPress: function () {
      const oView = this.getView();
      const sOrderNumber = oView.byId("input0").getValue();
      const dCreationDate = oView.byId("picker0").getDateValue();
      const aStatuses = oView.byId("box0").getSelectedKeys();

      const aFilters = [];

      if (sOrderNumber) {
        aFilters.push(new Filter("OrderNumber", FilterOperator.EQ, sOrderNumber));
      }

      if (dCreationDate) {
        const startOfDay = new Date(dCreationDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(dCreationDate);
        endOfDay.setHours(23, 59, 59, 999);

        const oDateFilter = new Filter({
          filters: [
            new Filter("CreationDate", FilterOperator.GE, startOfDay.toISOString()),
            new Filter("CreationDate", FilterOperator.LE, endOfDay.toISOString())
          ],
          and: true
        });
        aFilters.push(oDateFilter);
      }

      if (aStatuses && aStatuses.length > 0) {
        const aStatusFilters = aStatuses.map(sStatus =>
          new Filter("Status", FilterOperator.EQ, sStatus)
        );
        aFilters.push(new Filter({ filters: aStatusFilters, and: false }));
      }

      const oTable = oView.byId("orderTable");
      const oBinding = oTable.getBinding("items");
      if (oBinding) {
        oBinding.filter(aFilters);
        oBinding.sort(new Sorter("OrderNumber", false));
      }
    },

    onPressDetails: function (oEvent) {
      const oRouter = UIComponent.getRouterFor(this);
      const oContext = oEvent.getSource().getBindingContext("ordersModel");
      if (!oContext) {
        console.error("No binding context found for selected item.");
        return;
      }

      const sPath = oContext.getPath(); // e.g., /Orders/0
      const sEncodedPath = encodeURIComponent(sPath.substr(1)); // Orders/0

      oRouter.navTo("RouteDetailsOrder", {
        orderPath: sEncodedPath
      });
    },

    onPressAdd: function () {
      const oRouter = UIComponent.getRouterFor(this);
      oRouter.navTo("RouteCreateOrder");
    },

    onClearPress: function () {
      const oView = this.getView();
      oView.byId("input0").setValue("");
      oView.byId("picker0").setValue("");
      oView.byId("box0").removeAllSelectedItems();

      const oTable = oView.byId("orderTable");
      const oBinding = oTable.getBinding("items");
      if (oBinding) {
        oBinding.filter([]);
      }
    },

    onDeletePress: function () {
      const oTable = this.byId("orderTable");
      const aSelectedItems = oTable.getSelectedItems();

      if (aSelectedItems.length === 0) {
        MessageBox.warning("Please select at least one order to delete.");
        return;
      }

      MessageBox.confirm(`Are you sure you want to delete the selected ${aSelectedItems.length} order(s)?`, {
        title: "Confirm Deletion",
        onClose: (sAction) => {
          if (sAction === MessageBox.Action.OK) {
            const oModel = this.getView().getModel("ordersModel");
            const aOrders = oModel.getProperty("/Orders");

            aSelectedItems.forEach((oItem) => {
              const oContext = oItem.getBindingContext("ordersModel");
              if (oContext) {
                const sPath = oContext.getPath();
                const iIndex = parseInt(sPath.split("/").pop(), 10);
                if (!isNaN(iIndex)) {
                  aOrders.splice(iIndex, 1);
                }
              }
            });

            oModel.setProperty("/Orders", aOrders);
            oTable.removeSelections();
            this.updateTitleCount();
            MessageToast.show("Selected orders have been deleted.");
          }
        }
      });
    }

  });
});