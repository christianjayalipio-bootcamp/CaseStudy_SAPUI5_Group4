sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "com/ui5/trng/project1/controller/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, UIComponent, formatter, Filter, FilterOperator, Sorter, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("com.ui5.trng.project1.controller.MainView", {

        formatter: formatter,

        updateTitleCount: function () {
            var oTable = this.byId("table0");
            var oTitle = this.byId("itemCounter");
            var oBinding = oTable.getBinding("items");
            if (oBinding) {
                var iCount = oBinding.getLength();
                oTitle.setText("Orders (" + iCount + ")");
            } else {
                oTitle.setText("Orders (0)");
            }
        },

        onInit: function () {
            var oTable = this.byId("table0");

            oTable.attachUpdateFinished(this.updateTitleCount.bind(this));

            this.updateTitleCount();
        },

        onPressDetails: function (oEvent) {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            var oContext = oEvent.getSource().getBindingContext();

            if (!oContext) {
                console.error("No binding context found for selected item.");
                return;
            }

            var sPath = oContext.getPath();
            var sEncodedPath = encodeURIComponent(sPath.substr(1));

            oRouter.navTo("RouteDetailsOrder", {
                orderPath: sEncodedPath
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

            if (sOrderNumber) {
                aFilters.push(new Filter("OrderID", FilterOperator.EQ, parseInt(sOrderNumber, 10)));
            }

            if (dCreationDate) {
                var startOfDay = new Date(dCreationDate);
                startOfDay.setHours(0, 0, 0, 0);

                var endOfDay = new Date(dCreationDate);
                endOfDay.setHours(23, 59, 59, 999);

                var oDateFilter = new Filter({
                    filters: [
                        new Filter("CreatedOn", FilterOperator.GE, startOfDay.toISOString()),
                        new Filter("CreatedOn", FilterOperator.LE, endOfDay.toISOString())
                    ],
                    and: true
                });
                aFilters.push(oDateFilter);
            }

            if (aStatuses && aStatuses.length > 0) {
                var aStatusFilters = aStatuses.map(function (sStatus) {
                    return new Filter("Status", FilterOperator.EQ, sStatus);
                });
                aFilters.push(new Filter({ filters: aStatusFilters, and: false }));
            }

            var oTable = oView.byId("table0");
            var oBinding = oTable.getBinding("items");
            if (oBinding) {
                oBinding.filter(aFilters);
                var oSorter = new Sorter("OrderID", false);
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
            if (oBinding) {
                oBinding.filter([]);
            }
        },

        onDeletePress: function () {
            var oTable = this.byId("table0");
            var aSelectedItems = oTable.getSelectedItems();

            if (aSelectedItems.length === 0) {
                MessageBox.error("Please select an item from the table");
                return;
            }

            var that = this;

            MessageBox.confirm(
                "Are you sure you want to delete " + aSelectedItems.length + " item(s)?",
                {
                    actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                    emphasizedAction: MessageBox.Action.YES,
                    onClose: function (sAction) {
                        if (sAction === MessageBox.Action.YES) {
                            var oModel = oTable.getModel();
                            var iPending = aSelectedItems.length;

                            aSelectedItems.forEach(function (oItem) {
                                var oContext = oItem.getBindingContext();
                                oModel.remove(oContext.getPath(), {
                                    success: function () {
                                        MessageToast.show("Item deleted successfully");
                                        iPending--;
                                        if (iPending === 0) {
                                            that.updateTitleCount(); // update title after all deletions
                                        }
                                    },
                                    error: function () {
                                        MessageBox.error("Error while deleting item");
                                        iPending--;
                                        if (iPending === 0) {
                                            that.updateTitleCount();
                                        }
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
