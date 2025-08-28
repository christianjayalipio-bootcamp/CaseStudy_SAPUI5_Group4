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
            
      updateProductTitle: function () {
    const oTable = this.byId("productsTableEdit");
    if (!oTable) return;

    const iItemCount = oTable.getItems().length;

    const oPanel = this.byId("productpanel"); // <--- Correct ID
    if (oPanel) {
        oPanel.setHeaderText("Products (" + iItemCount + ")");
    }
},


        _onRouteMatched: function (oEvent) {
            const sOrderPath = decodeURIComponent(oEvent.getParameter("arguments").orderPath);
            this._sOrderPath = sOrderPath;

            const oView = this.getView();
            const oOrdersModel = oView.getModel("ordersModel");

            // Get order data and set edit model
            const oOrderData = JSON.parse(JSON.stringify(oOrdersModel.getProperty("/" + sOrderPath)));
            const oEditModel = new JSONModel(oOrderData);
            oView.setModel(oEditModel, "editModel");

            // Bind the view to edit model
            oView.bindElement({
                path: "/",
                model: "editModel",
                events: {
                    dataRequested: function () { oView.setBusy(true); },
                    dataReceived: function () { oView.setBusy(false); }
                }
            });

            // Prepare products for this order
            const sOrderNumber = oOrderData.OrderNumber;
            const aOrderProducts = oOrdersModel.getProperty("/OrderProducts") || [];
            const aProducts = oOrdersModel.getProperty("/Products") || [];

            const aMatchedProducts = aOrderProducts
                .filter(op => op.OrderNumber === sOrderNumber)
                .map(op => {
                    const oProduct = aProducts.find(p => p.ProductID === op.ProductID) || {};
                    const fPricePerUnit = parseFloat(oProduct.PricePerUnit) || 0;
                    const fQuantity = parseFloat(op.Quantity) || 0;
                    const fTotalPrice = fPricePerUnit * fQuantity;

                    return {
                        ProductID: op.ProductID,
                        ProductName: oProduct.ProductName || op.ProductID,
                        Quantity: fQuantity,
                        PricePerUnit: fPricePerUnit.toFixed(2),
                        TotalPrice: fTotalPrice.toFixed(2)
                    };
                });

            const oProductsModel = new JSONModel(aMatchedProducts);
            oView.setModel(oProductsModel, "orderProductsModel");

            // Attach updateFinished to count products
            const oTable = this.byId("productsTableEdit");
            if (oTable) {
                oTable.attachUpdateFinished(this.updateProductTitle.bind(this));
            }
        },

        // Add Product dialog
        onAddProduct: function () {
            const oView = this.getView();
            const oOrdersModel = oView.getModel("ordersModel");
            const oEditModel = oView.getModel("editModel");

            const sDeliveringPlant = oEditModel.getProperty("/DeliveringPlantID");
            let aProducts = oOrdersModel.getProperty("/Products") || [];
            aProducts = aProducts.filter(p => p.DeliveringPlantID === sDeliveringPlant);

            if (aProducts.length === 0) {
                MessageToast.show("No products available for the selected Delivering Plant.");
                return;
            }

            let oSelectedProduct = null;

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
                                    new Filter("ProductName", FilterOperator.Contains, sQuery)
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
                        const oProductsModel = oView.getModel("orderProductsModel");
                        const aSelectedProducts = oProductsModel.getData();

                        aSelectedProducts.push({
                            ProductID: oSelectedProduct.ProductID,
                            ProductName: oSelectedProduct.ProductName,
                            Quantity: iQty,
                            PricePerUnit: parseFloat(oSelectedProduct.PricePerUnit).toFixed(2),
                            TotalPrice: fTotal.toFixed(2)
                        });

                        oProductsModel.setData(aSelectedProducts);
                        oProductsModel.refresh();

                        sap.ui.getCore().byId("editQtyInput").setValue("1");
                        oSelectedProduct = null;
                        oDialog.close();

                        // Update product count
                        this.updateProductTitle();
                    }.bind(this)
                }),
                endButton: new Button({
                    text: "Cancel",
                    type: "Reject",
                    press: function () { oDialog.close(); }
                }),
                afterClose: function () { oDialog.destroy(); }
            });

            const oList = oDialog.getContent()[1];
            oDialog.setModel(new JSONModel(aProducts));
            oDialog.open();
        },

        // Delete selected products
        onDeleteProducts: function () {
            const oTable = this.byId("productsTableEdit");
            const aSelectedItems = oTable.getSelectedItems();

            if (aSelectedItems.length === 0) {
                MessageToast.show("Please select at least one item from the table.");
                return;
            }

            const iCount = aSelectedItems.length;

            MessageBox.confirm("Are you sure you want to delete " + iCount + " item(s)?", {
                title: "Confirm Deletion",
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.YES) {
                        const oModel = this.getView().getModel("orderProductsModel");
                        let aData = oModel.getData();

                        for (let i = aSelectedItems.length - 1; i >= 0; i--) {
                            const oItem = aSelectedItems[i];
                            const oContext = oItem.getBindingContext("orderProductsModel");
                            const iIndex = parseInt(oContext.getPath().split("/")[1], 10);
                            aData.splice(iIndex, 1);
                        }

                        oModel.setData(aData);
                        oTable.removeSelections();

                        MessageToast.show(iCount + " item(s) deleted.");

                        // Update product count
                        this.updateProductTitle();
                    }
                }.bind(this)
            });
        },

        // Update product panel header with count
        updateProductTitle: function () {
            const oTable = this.byId("productsTableEdit");
            if (!oTable) return;

            const iItemCount = oTable.getItems().length;

            const oPanel = this.byId("productpanel");
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

                        const sNewStatus = oEditModel.getProperty("/Status");
                        oOrdersModel.setProperty("/" + that._sOrderPath + "/Status", sNewStatus);

                        const sOrderNumber = oOrdersModel.getProperty("/" + that._sOrderPath + "/OrderNumber");

                        const aSelectedItems = oTable.getSelectedItems();
                        const aSelectedProducts = aSelectedItems.map(oItem =>
                            oItem.getBindingContext("orderProductsModel").getObject()
                        );

                        let aAllOrderProducts = oOrdersModel.getProperty("/OrderProducts") || [];
                        aAllOrderProducts = aAllOrderProducts.filter(op => op.OrderNumber !== sOrderNumber);

                        const aNewOrderProducts = aSelectedProducts.map(p => ({
                            OrderNumber: sOrderNumber,
                            ProductID: p.ProductID,
                            Quantity: p.Quantity,
                            TotalPrice: parseFloat(p.TotalPrice).toFixed(2)
                        }));

                        aAllOrderProducts = aAllOrderProducts.concat(aNewOrderProducts);
                        oOrdersModel.setProperty("/OrderProducts", aAllOrderProducts);

                        MessageBox.success("The Order " + sOrderNumber + " has been successfully updated.", {
                            title: "Update Successful",
                            onClose: function () {
                                UIComponent.getRouterFor(that).navTo("RouteDetailsOrder", {
                                    orderPath: encodeURIComponent(that._sOrderPath)
                                });
                            }
                        });

                        this.updateProductTitle();
                    }
                }.bind(this)
            });
        }

    });
});