sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "sap/m/SelectDialog",
    "sap/m/StandardListItem"
], function (Controller, UIComponent, JSONModel, SelectDialog, StandardListItem) {
    "use strict";

    return Controller.extend("com.ui5.trng.project1.controller.CreateOrder", {

        onInit: function () {
            const oModel = new JSONModel();
            oModel.loadData("/localService/mainService/data/Orders.json");

            oModel.attachRequestCompleted(() => {
                const orders = oModel.getData() || [];

                // Flatten product data and extract plant info
                const flatData = orders.flatMap(order =>
                    order.Products.map(product => ({
                        ProductName: product.ProductName,
                        Quantity: product.Quantity,
                        PricePerQuantity: product.PricePerQuantity,
                        TotalPrice: product.Quantity * product.PricePerQuantity,
                        ReceivingPlant: order.ReceivingPlant,
                        DeliveringPlant: order.DeliveringPlant
                    }))
                );

                // Save original data for filtering reference
                this._originalProducts = flatData;

                // Extract unique plant values
                const receivingPlants = [...new Set(flatData.map(item => item.ReceivingPlant))];
                const deliveringPlants = [...new Set(flatData.map(item => item.DeliveringPlant))];

                // Set models
                this.getView().setModel(new JSONModel({ Orders: flatData }), "flat");
                this.getView().setModel(new JSONModel({
                    ReceivingPlants: receivingPlants,
                    DeliveringPlants: deliveringPlants
                }), "plants");

                // Set product count in the title
                this.updateProductCount();
            });
        },

        updateProductCount: function () {
            const oTitle = this.getView().byId("title_products");
            const oModel = this.getView().getModel("flat");
            const products = oModel.getProperty("/Orders") || [];
            if (oTitle) {
                oTitle.setText(`Products (${products.length})`);
            }
        },

        onValueHelpRequest: function (oEvent) {
            const sInputId = oEvent.getSource().getId();
            const oView = this.getView();
            const oModel = oView.getModel("plants");
            const oInput = oEvent.getSource();

            let aItems = [];
            let sTitle = "";

            if (sInputId.includes("recPlant")) {
                aItems = oModel.getProperty("/ReceivingPlants");
                sTitle = "Select Receiving Plant";
            } else if (sInputId.includes("delPlant")) {
                aItems = oModel.getProperty("/DeliveringPlants");
                sTitle = "Select Delivering Plant";
            }

            const oDialog = new SelectDialog({
                title: sTitle,
                items: aItems.map(plant => new StandardListItem({ title: plant })),
                search: function (oEvent) {
                    const sValue = oEvent.getParameter("value").toLowerCase();
                    const oFiltered = aItems.filter(p => p.toLowerCase().includes(sValue));
                    oDialog.removeAllItems();
                    oFiltered.forEach(p => oDialog.addItem(new StandardListItem({ title: p })));
                },
                confirm: (oEvent) => {
                    const sSelected = oEvent.getParameter("selectedItem").getTitle();
                    oInput.setValue(sSelected);
                    this.filterProducts();
                }
            });

            oDialog.open();
        },

        onPlantInputChange: function () {
            this.filterProducts();
        },

        filterProducts: function () {
            const sRecPlant = this.getView().byId("recPlant").getValue();
            const sDelPlant = this.getView().byId("delPlant").getValue();

            const filtered = this._originalProducts.filter(p => {
                const matchRec = sRecPlant ? p.ReceivingPlant === sRecPlant : true;
                const matchDel = sDelPlant ? p.DeliveringPlant === sDelPlant : true;
                return matchRec && matchDel;
            });

            this.getView().getModel("flat").setProperty("/Orders", filtered);
            this.updateProductCount();
        },

        onPressCancel: function () {
            const oRouter = UIComponent.getRouterFor(this);
            oRouter.navTo("RouteMainView");
        }
    });
});