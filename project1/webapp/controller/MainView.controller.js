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

            var sPath = oContext.getPath();
            oRouter.navTo("RouteDetailsOrder", {
                orderPath: encodeURIComponent(sPath)
            });
        },

        onPressAdd: function () {
            var oRouter = UIComponent.getRouterFor(this);
            oRouter.navTo("RouteCreateOrder");
        },

        /** 
         * Apply filters when Go button is pressed 
         */
        onGoPress: function () {
            var oView = this.getView();

            var sOrderNumber = oView.byId("input0").getValue();
            var dCreationDate = oView.byId("picker0").getDateValue();
            var sStatus = oView.byId("box0").getSelectedKey();

            var aFilters = [];

            if (sOrderNumber) {
                aFilters.push(new Filter("OrderID", FilterOperator.EQ, sOrderNumber));
            }

            if (dCreationDate) {
                // Format date to YYYY-MM-DD for comparison
                var sDate = dCreationDate.toISOString().split("T")[0];
                aFilters.push(new Filter("OrderDate", FilterOperator.EQ, sDate));
            }

            if (sStatus) {
                aFilters.push(new Filter("Status", FilterOperator.EQ, sStatus));
            }

            var oTable = oView.byId("table0");
            var oBinding = oTable.getBinding("items");
            oBinding.filter(aFilters);
        },

        /**
         * Reset filters and clear inputs
         */
        onClearPress: function () {
            var oView = this.getView();

            oView.byId("input0").setValue("");
            oView.byId("picker0").setValue("");
            oView.byId("box0").setSelectedKey("");

            var oTable = oView.byId("table0");
            var oBinding = oTable.getBinding("items");
            oBinding.filter([]); // remove all filters
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
