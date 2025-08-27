sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "com/ui5/trng/project1/controller/formatter",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/SearchField",
    "sap/m/List",
    "sap/m/StandardListItem",
    "sap/m/Input",
    "sap/m/Label",
    "sap/m/Button",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/Text"
], function (
    Controller, UIComponent, JSONModel, formatter, MessageBox,
    Dialog, SearchField, List, StandardListItem, Input, Label, Button, MessageToast,
    Filter, FilterOperator, Text
) {
    "use strict";

    return Controller.extend("com.ui5.trng.project1.controller.EditOrder", {

        formatter: formatter,

        onInit: function () {
            const oRouter = UIComponent.getRouterFor(this);
            oRouter.getRoute("RouteEditOrder").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            const sOrderPath = decodeURIComponent(oEvent.getParameter("arguments").orderPath);
            this._sOrderPath = sOrderPath;

            const oView = this.getView();
            const oOrdersModel = oView.getModel("ordersModel");

            // Get original order data and clone it into a local edit model
            const oOrderData = JSON.parse(JSON.stringify(oOrdersModel.getProperty("/" + sOrderPath)));
            const oEditModel = new sap.ui.model.json.JSONModel(oOrderData);
            oView.setModel(oEditModel, "editModel");

            // Bind the view to the local edit model instead of the global one
            oView.bindElement({
                path: "/",
                model: "editModel",
                events: {
                    dataRequested: function () {
                        oView.setBusy(true);
                    },
                    dataReceived: function () {
                        oView.setBusy(false);

                        const oTable = this.byId("productsTableEdit");
                        if (oTable) {
                            oTable.attachUpdateFinished(this.updateProductTitle.bind(this));
                        }
                    }.bind(this)
                }
            });

            // Load and filter products for this order
            const sOrderNumber = oOrderData.OrderNumber;
            const aOrderProducts = oOrdersModel.getProperty("/OrderProducts") || [];
            const aProducts = oOrdersModel.getProperty("/Products") || [];

            const aMatchedProducts = aOrderProducts
                .filter(op => op.OrderNumber === sOrderNumber)
                .map(op => {
                    const oProduct = aProducts.find(p => p.ProductID === op.ProductID) || {};
                    return {
                        ProductID: op.ProductID,
                        ProductName: oProduct.ProductName || op.ProductID,
                        Quantity: op.Quantity,
                        PricePerUnit: oProduct.PricePerUnit || 0,
                        TotalPrice: op.TotalPrice || 0
                    };
                });

            const oProductsModel = new sap.ui.model.json.JSONModel(aMatchedProducts);
            oView.setModel(oProductsModel, "orderProductsModel");
        },

        // Add Product dialog
        onAddProduct: function () {
            const oOrdersModel = this.getView().getModel("ordersModel");
            const aProducts = oOrdersModel.getProperty("/Products") || [];
            let oSelectedProduct = null;

            if (aProducts.length === 0) {
                MessageToast.show("No products available.");
                return;
            }

            const oDialog = new Dialog({
                title: "Add Product",
                contentWidth: "400px",
                contentHeight: "550px",
                content: [
                    new SearchField({
                        placeholder: "Search products...",
                        liveChange: function (oEvt) {
                            const sQuery = oEvt.getParameter("newValue").trim();
                            const oFilter = new Filter({
                                filters: [
                                    new Filter("ProductID", FilterOperator.StartsWith, sQuery),
                                    new Filter("ProductName", FilterOperator.StartsWith, sQuery)
                                ],
                                and: false
                            });
                            oList.getBinding("items").filter(sQuery ? [oFilter] : []);
                        }
                    }),
                    new List("editProductList", {
                        items: {
                            path: "/",
                            template: new StandardListItem({
                                title: "{ProductName}",
                                description: "{ProductID}"
                            })
                        },
                        mode: "SingleSelectMaster",
                        selectionChange: function (oEvt) {
                            oSelectedProduct = oEvt.getParameter("listItem").getBindingContext().getObject();
                        }
                    }),
                    new Label({ text: "Quantity", required: true }),
                    new Input("editQtyInput", {
                        type: "Number",
                        value: "1",
                        required: true,
                        width: "100%",
                        placeholder: "Enter quantity"
                    })
                ],
                beginButton: new Button({
                    text: "Add",
                    type: "Accept",
                    press: function () {
                        const iQty = parseInt(sap.ui.getCore().byId("editQtyInput").getValue(), 10);

                        if (!oSelectedProduct || isNaN(iQty) || iQty <= 0) {
                            MessageToast.show("Please select a product and enter a valid quantity.");
                            return;
                        }

                        const fTotal = iQty * oSelectedProduct.PricePerUnit;
                        const oProductsModel = this.getView().getModel("orderProductsModel");
                        const aSelectedProducts = oProductsModel.getData();

                        aSelectedProducts.push({
                            ProductID: oSelectedProduct.ProductID,
                            ProductName: oSelectedProduct.ProductName,
                            Quantity: iQty,
                            PricePerUnit: oSelectedProduct.PricePerUnit,
                            TotalPrice: fTotal
                        });

                        oProductsModel.setData(aSelectedProducts);
                        oProductsModel.refresh();

                        sap.ui.getCore().byId("editQtyInput").setValue("1");
                        oSelectedProduct = null;
                        oDialog.close();
                    }.bind(this)
                }),
                endButton: new Button({
                    text: "Cancel",
                    type: "Reject",
                    press: function () {
                        oDialog.close();
                    }
                }),
                afterClose: function () {
                    oDialog.destroy();
                }
            });

            const oList = oDialog.getContent()[1]; // the product list
            oDialog.setModel(new JSONModel(aProducts));
            oDialog.open();
        },

        // Delete selected products
onDeleteProducts: function () {
    var oTable = this.byId("productsTableEdit");
    var aSelectedItems = oTable.getSelectedItems();

    if (aSelectedItems.length === 0) {
        sap.m.MessageToast.show("Please select at least one item from the table.");
        return;
    }

    var iCount = aSelectedItems.length;

    // Show confirmation message
    MessageBox.confirm("Are you sure you want to delete " + iCount + " item(s)?", {
        title: "Confirm Deletion",
        actions: [MessageBox.Action.YES, MessageBox.Action.NO],
        onClose: function (oAction) {
            if (oAction === MessageBox.Action.YES) {
                var oModel = this.getView().getModel("orderProductsModel");
                var aData = oModel.getData();

                // loop through selected items and remove them
                for (var i = aSelectedItems.length - 1; i >= 0; i--) {
                    var oItem = aSelectedItems[i];
                    var oContext = oItem.getBindingContext("orderProductsModel");
                    var iIndex = parseInt(oContext.getPath().split("/")[1], 10);
                    aData.splice(iIndex, 1);
                }

                // update model
                oModel.setData(aData);

                // clear selection
                oTable.removeSelections();

                sap.m.MessageToast.show(iCount + " item(s) deleted.");
            }
        }.bind(this)
    });
},

        updateProductTitle: function () {
            const oTable = this.byId("productsTableEdit");
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
            const oView = this.getView();
            const oTable = this.byId("productsTableEdit");

            // Validate product selection
            if (!oTable || oTable.getSelectedItems().length === 0) {
                MessageBox.warning("Please select at least one product before saving.");
                return;
            }

            MessageBox.confirm("Are you sure you want to save these changes?", {
                title: "Confirm Save",
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.YES) {
                        const oOrdersModel = oView.getModel("ordersModel");
                        const oEditModel = oView.getModel("editModel");
                        const oOrderProductsModel = oView.getModel("orderProductsModel");

                        // Get updated status from editModel
                        const sNewStatus = oEditModel.getProperty("/Status");

                        // Update status in global ordersModel
                        oOrdersModel.setProperty("/" + that._sOrderPath + "/Status", sNewStatus);

                        // Get current order number
                        const sOrderNumber = oOrdersModel.getProperty("/" + that._sOrderPath + "/OrderNumber");

                        // Get selected products
                        const aSelectedItems = oTable.getSelectedItems();
                        const aSelectedProducts = aSelectedItems.map(function (oItem) {
                            return oItem.getBindingContext("orderProductsModel").getObject();
                        });

                        // Get all existing order products
                        let aAllOrderProducts = oOrdersModel.getProperty("/OrderProducts") || [];

                        // Remove old products for this order
                        aAllOrderProducts = aAllOrderProducts.filter(op => op.OrderNumber !== sOrderNumber);

                        // Add updated products for this order
                        const aNewOrderProducts = aSelectedProducts.map(p => ({
                            OrderNumber: sOrderNumber,
                            ProductID: p.ProductID,
                            Quantity: p.Quantity,
                            TotalPrice: p.TotalPrice
                        }));

                        aAllOrderProducts = aAllOrderProducts.concat(aNewOrderProducts);

                        // Update global model
                        oOrdersModel.setProperty("/OrderProducts", aAllOrderProducts);

                        // Navigate back to details view
                        MessageBox.success("The order has been successfully updated.", {
                            title: "Update Successful",
                            onClose: function () {
                                UIComponent.getRouterFor(that).navTo("RouteDetailsOrder", {
                                    orderPath: encodeURIComponent(that._sOrderPath)
                                });
                            }
                        });
                    }
                }
            });
        }


    });
});