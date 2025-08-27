sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "com/ui5/trng/project1/controller/formatter",
    "sap/m/MessageBox"
], function (Controller, UIComponent, JSONModel, formatter, MessageBox) {
    "use strict";

    return Controller.extend("com.ui5.trng.project1.controller.EditOrder", {

        formatter: formatter,

        onInit: function () {
            const oRouter = UIComponent.getRouterFor(this);
            oRouter.getRoute("RouteEditOrder").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            const sOrderPath = decodeURIComponent(oEvent.getParameter("arguments").orderPath);
            this._sOrderPath = sOrderPath; // store for save or cancel navigation

            const oView = this.getView();
            const oModel = oView.getModel("ordersModel");

            // Bind the view to the selected order
            oView.bindElement({
                path: "/" + sOrderPath,
                model: "ordersModel",
                events: {
                    dataRequested: function () {
                        oView.setBusy(true);
                    },
                    dataReceived: function () {
                        oView.setBusy(false);

                        const oTable = this.byId("detailpanel");
                        if (oTable) {
                            oTable.attachUpdateFinished(this.updateProductTitle.bind(this));
                        }
                    }.bind(this)
                }
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

        updateProductTitle: function () {
            const oTable = this.byId("detailpanel");
            const iItemCount = oTable.getItems().length;

            const oPanel = this.byId("detail");
            if (oPanel) {
                oPanel.setHeaderText("Products (" + iItemCount + ")");
            }
        },

        onCancelPress: function () {
            const that = this;
            MessageBox.confirm("Are you sure you want to cancel the changes done in the page?", {
                title: "Confirm Cancel",
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.YES) {
                        const oRouter = UIComponent.getRouterFor(that);
                        oRouter.navTo("RouteDetailsOrder", {
                            orderPath: encodeURIComponent(that._sOrderPath)
                        });
                    }
                }
            });
        },

        onSavePress: function () {
            const that = this;
            MessageBox.confirm("Are you sure you want to save these changes?", {
                title: "Confirm Save",
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.YES) {
                        const oModel = that.getView().getModel("ordersModel");
                        if (oModel.hasPendingChanges()) {
                            oModel.submitChanges({
                                success: function () {
                                    MessageBox.success("The order has been successfully updated.", {
                                        title: "Update Successful",
                                        onClose: function () {
                                            UIComponent.getRouterFor(that).navTo("RouteDetailsOrder", {
                                                orderPath: encodeURIComponent(that._sOrderPath)
                                            });
                                        }
                                    });
                                },
                                error: function () {
                                    MessageBox.error("Failed to update the order. Please try again.");
                                }
                            });
                        } else {
                            MessageBox.information("No changes to save.");
                        }
                    }
                }
            });
        }
    });
});
