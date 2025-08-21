sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "com/ui5/trng/project1/controller/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, UIComponent, formatter, Filter, FilterOperator, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("com.ui5.trng.project1.controller.MainView", {

        formatter: formatter,

        onPressDetails: function (oEvent) {
            var oRouter = UIComponent.getRouterFor(this);
            var oItem = oEvent.getSource();
            var oContext = oItem.getBindingContext();

            if (!oContext) {
                console.error("No binding context found for the selected row.");
                return;
            }

            var sOrderID = oContext.getProperty("OrderID");

            oRouter.navTo("RouteDetailsOrder", {
                orderId: sOrderID
            });
        },

        onPressAdd: function () {
            var oRouter = UIComponent.getRouterFor(this);
            oRouter.navTo("RouteCreateOrder");
        },

        onGoPress: function () {
            var oView = this.getView();

            var sOrderNumber = oView.byId("input0").getValue();
            var dCreationDate = oView.byId("picker0").getDateValue();
            var aStatuses = oView.byId("box0").getSelectedKeys();

            var aFilters = [];

            // Filter by Order ID
            if (sOrderNumber) {
                aFilters.push(new Filter("OrderID", FilterOperator.EQ, sOrderNumber));
            }

            // Filter by Creation Date (raw OData date)
            if (dCreationDate) {
                var startOfDay = new Date(dCreationDate);
                startOfDay.setHours(0, 0, 0, 0);

                var endOfDay = new Date(dCreationDate);
                endOfDay.setHours(23, 59, 59, 999);

                aFilters.push(new Filter("OrderDate", FilterOperator.GE, startOfDay.toISOString()));
                aFilters.push(new Filter("OrderDate", FilterOperator.LE, endOfDay.toISOString()));
            }

            // Filter by Status (multi-selection)
            if (aStatuses && aStatuses.length > 0) {
                var aStatusFilters = aStatuses.map(function (sStatus) {
                    return new Filter("Status", FilterOperator.EQ, sStatus);
                });
                aFilters.push(new Filter({
                    filters: aStatusFilters,
                    and: false
                }));
            }

            // Apply filters and sorter
            var oTable = oView.byId("table0");
            var oBinding = oTable.getBinding("items");
            if (oBinding) {

                oBinding.filter(aFilters);
                var oSorter = new sap.ui.model.Sorter("OrderID", false);
                oBinding.sort(oSorter);
            }
        },

        onClearPress: function () {
            var oView = this.getView();

            oView.byId("input0").setValue("");
            oView.byId("picker0").setValue("");
            oView.byId("box0").removeAllSelectedItems();

            var oTable = oView.byId("table0");
            var oBinding = oTable.getBinding("items");
            oBinding.filter([]);
        },
        onDeletePress: function () {
            var oTable = this.byId("table0");
            var aSelectedItems = oTable.getSelectedItems();

            if (aSelectedItems.length === 0) {
                sap.m.MessageBox.error("Please select an item from the table");
                return;
            }

            var that = this;
            sap.m.MessageBox.confirm(
                "Are you sure you want to delete " + aSelectedItems.length + " item(s)?",
                {
                    actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                    emphasizedAction: sap.m.MessageBox.Action.YES,
                    onClose: function (sAction) {
                        if (sAction === sap.m.MessageBox.Action.YES) {
                            var oModel = oTable.getModel();

                            aSelectedItems.forEach(function (oItem) {
                                var oContext = oItem.getBindingContext();
                                oModel.remove(oContext.getPath(), {
                                    success: function () {
                                        sap.m.MessageToast.show("Item deleted successfully");
                                    },
                                    error: function () {
                                        sap.m.MessageBox.error("Error while deleting item");
                                    }
                                });
                            });
                        }
                    }
                }
            );
        }
    });
});
