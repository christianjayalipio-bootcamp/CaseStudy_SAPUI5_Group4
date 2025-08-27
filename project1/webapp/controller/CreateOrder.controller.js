sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/UIComponent",
  "sap/m/Dialog",
  "sap/m/SearchField",
  "sap/m/List",
  "sap/m/Input",
  "sap/m/Button",
  "sap/m/Label",
  "sap/m/Text",
  "sap/m/StandardListItem",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator"
], function (
  Controller, UIComponent, Dialog, SearchField, List, Input, Button, Label, Text,
  StandardListItem, JSONModel, MessageToast, Filter, FilterOperator
) {
  "use strict";

  return Controller.extend("com.ui5.trng.project1.controller.CreateOrder", {

    onInit: function () {
      const oOrdersModel = this.getOwnerComponent().getModel("ordersModel");
      this.getView().setModel(oOrdersModel, "ordersModel");

      const oOrderModel = new JSONModel({
        ReceivingPlantID: "",
        DeliveringPlantID: "",
        SelectedProducts: []
      });
      this.getView().setModel(oOrderModel, "orderModel");

      const oTable = this.byId("productTable");
      if (oTable) {
        oTable.attachUpdateFinished(this.updateProductTitle.bind(this));
      }
    },

    updateProductTitle: function () {
      const oTable = this.byId("productTable");
      const iItemCount = oTable.getItems().length;
      const oTitle = this.byId("title_products");
      if (oTitle) {
        oTitle.setText("Products (" + iItemCount + ")");
      }
    },

    onValueHelpRequest: function (oEvent) {
      const sInputId = oEvent.getSource().getId();
      const sTitle = sInputId.includes("recPlant") ? "Select Receiving Plant" : "Select Delivering Plant";

      const oDialog = new Dialog({
        title: sTitle,
        contentWidth: "400px",
        contentHeight: "500px",
        endButton: new Button({
          text: "Cancel",
          press: function () {
            oDialog.close();
          }
        }),
        afterClose: function () {
          oDialog.destroy();
        }
      });

      const oSearchField = new SearchField({
        placeholder: "Search...",
        liveChange: function (oEvt) {
          const sQuery = oEvt.getParameter("newValue").trim();
          const oFilter = new Filter({
            filters: [
              new Filter("PlantID", FilterOperator.StartsWith, sQuery),
              new Filter("Description", FilterOperator.StartsWith, sQuery)
            ],
            and: false
          });
          oList.getBinding("items").filter(sQuery ? [oFilter] : []);
        }
      });

      const oList = new List({
        items: {
          path: "ordersModel>/Plants",
          template: new StandardListItem({
            title: "{ordersModel>PlantID}",
            description: "{ordersModel>Description}"
          })
        },
        mode: "SingleSelectMaster",
        selectionChange: function (oEvt) {
          const sSelectedPlantID = oEvt.getParameter("listItem").getBindingContext("ordersModel").getProperty("PlantID");
          const oOrderModel = this.getView().getModel("orderModel");

          if (sInputId.includes("recPlant")) {
            oOrderModel.setProperty("/ReceivingPlantID", sSelectedPlantID);
          } else {
            oOrderModel.setProperty("/DeliveringPlantID", sSelectedPlantID);
            this._filterProductsByDeliveringPlant(sSelectedPlantID);
          }

          oDialog.close();
        }.bind(this)
      });

      oDialog.addContent(oSearchField);
      oDialog.addContent(oList);
      oDialog.setModel(this.getView().getModel("ordersModel"), "ordersModel");
      oDialog.open();
    },

    _filterProductsByDeliveringPlant: function (sPlantID) {
      const aProducts = this.getView().getModel("ordersModel").getProperty("/Products") || [];
      const aFiltered = aProducts.filter(p => p.DeliveringPlantID === sPlantID);
      const oTempModel = new JSONModel(aFiltered);
      this.getView().setModel(oTempModel, "filteredProductsModel");
    },

    onAddProduct: function () {
      const oOrderModel = this.getView().getModel("orderModel");
      const sReceivingPlant = oOrderModel.getProperty("/ReceivingPlantID");
      const sDeliveringPlant = oOrderModel.getProperty("/DeliveringPlantID");

      if (!sReceivingPlant || !sDeliveringPlant) {
        MessageToast.show("Please select both Receiving and Delivering Plants.");
        return;
      }

      const oFilteredModel = this.getView().getModel("filteredProductsModel");
      const aFilteredProducts = oFilteredModel?.getData() || [];

      if (aFilteredProducts.length === 0) {
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
                  new Filter("ProductName", FilterOperator.StartsWith, sQuery)
                ],
                and: false
              });
              oList.getBinding("items").filter(sQuery ? [oFilter] : []);
            }
          }),
          new List("productList", {
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
          new Label({
            text: "Quantity",
            labelFor: "qtyInput",
            design: "Bold",
            required: true,
            class: "sapUiSmallMarginTop sapUiSmallMarginBottom"
          }),
          new Input("qtyInput", {
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
            const iQty = parseInt(sap.ui.getCore().byId("qtyInput").getValue(), 10);
            if (!oSelectedProduct || isNaN(iQty) || iQty <= 0) {
              MessageToast.show("Please select a product and enter a valid quantity.");
              return;
            }

            const fTotal = iQty * oSelectedProduct.PricePerUnit;
            const aSelectedProducts = oOrderModel.getProperty("/SelectedProducts") || [];

            aSelectedProducts.push({
              ProductName: oSelectedProduct.ProductName,
              Quantity: iQty,
              PricePerQuantity: oSelectedProduct.PricePerUnit.toFixed(2),
              TotalPrice: fTotal.toFixed(2)
            });

            oOrderModel.setProperty("/SelectedProducts", aSelectedProducts);
            sap.ui.getCore().byId("qtyInput").setValue("1");
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

      const oList = oDialog.getContent()[1];
      oDialog.setModel(oFilteredModel);
      oDialog.open();
    },

    onDeleteProducts: function () {
      const oTable = this.byId("productTable");
      const aSelectedItems = oTable.getSelectedItems();

      if (aSelectedItems.length === 0) {
        MessageToast.show("Please select an item from the table.");
        return;
      }

      const iCount = aSelectedItems.length;
      const sMessage = `Are you sure you want to delete ${iCount} item${iCount > 1 ? "s" : ""}?`;

      const oConfirmDialog = new Dialog({
        title: "Confirm Deletion",
        type: "Message",
        content: new Text({ text: sMessage }),
        beginButton: new Button({
          text: "Delete",
          type: "Reject",
          press: function () {
            const oOrderModel = this.getView().getModel("orderModel");
            const aProducts = oOrderModel.getProperty("/SelectedProducts");
            const aToDelete = aSelectedItems.map(item => item.getBindingContext("orderModel").getObject());
            const aRemaining = aProducts.filter(product => !aToDelete.includes(product));
            oOrderModel.setProperty("/SelectedProducts", aRemaining);
            oTable.removeSelections();
            oConfirmDialog.close();
          }.bind(this)
        }),
        endButton: new Button({
          text: "Cancel",
          press: function () {
            oConfirmDialog.close();
          }
        }),
        afterClose: function () {
          oConfirmDialog.destroy();
        }
      });

      oConfirmDialog.open();
    },

    onPressCancel: function () {
      const oConfirmDialog = new Dialog({
        title: "Confirm Cancel",
        type: "Message",
        content: new Text({ text: "Are you sure you want to cancel the changes done in the page?" }),
        beginButton: new Button({
          text: "Yes",
          type: "Emphasized",
          press: function () {
            const oOrderModel = this.getView().getModel("orderModel");
            oOrderModel.setProperty("/ReceivingPlantID", "");
            oOrderModel.setProperty("/DeliveringPlantID", "");
            oOrderModel.setProperty("/SelectedProducts", []);

            const oRouter = UIComponent.getRouterFor(this);
            oRouter.navTo("RouteMainView");

            oConfirmDialog.close();
          }.bind(this)
        }),
        endButton: new Button({
          text: "No",
          press: function () {
            oConfirmDialog.close();
          }
        }),
        afterClose: function () {
          oConfirmDialog.destroy();
        }
      });

      oConfirmDialog.open();
    },

    onSaveOrder: function () {
      // Get the models for the order form and the shared orders list
      const oOrderModel = this.getView().getModel("orderModel");
      const oOrdersModel = this.getView().getModel("ordersModel");

      // Retrieve values entered by the user
      const sReceivingPlant = oOrderModel.getProperty("/ReceivingPlantID");
      const sDeliveringPlant = oOrderModel.getProperty("/DeliveringPlantID");

      // Get only the products that were selected via checkboxes
      const oTable = this.byId("productTable");
      const aSelectedItems = oTable.getSelectedItems();
      const aSelectedProducts = aSelectedItems.map(item =>
        item.getBindingContext("orderModel").getObject()
      );

      // Validate that all required fields are filled and at least one product is selected
      if (!sReceivingPlant || !sDeliveringPlant || aSelectedProducts.length === 0) {
        sap.m.MessageToast.show("Please complete all required fields and select at least one product.");
        return;
      }

      // Generate a unique order number and the current date
      const sOrderNumber = this._generateOrderNumber();
      const sCreationDate = this._getCurrentDate();

      // Create the new order object
      const oNewOrder = {
        OrderNumber: sOrderNumber,
        CreationDate: sCreationDate,
        DeliveringPlantID: sDeliveringPlant,
        ReceivingPlantID: sReceivingPlant,
        Status: "Created",
        SelectedProducts: aSelectedProducts // Optional: include selected products in the order
      };

      // Track whether the user confirmed the save
      let bConfirmed = false;

      // Create a confirmation dialog before saving
      const oConfirmDialog = new sap.m.Dialog({
        title: "Confirm Save",
        type: "Message",
        content: new sap.m.Text({ text: "Are you sure you want to save these changes?" }),

        // If user clicks "Yes", save the order and navigate back
        beginButton: new sap.m.Button({
          text: "Yes",
          type: "Emphasized",
          press: function () {
            const aOrders = oOrdersModel.getProperty("/Orders") || [];
            aOrders.push(oNewOrder);
            oOrdersModel.setProperty("/Orders", aOrders);

            // Clear the form fields and product selections
            oOrderModel.setProperty("/ReceivingPlantID", "");
            oOrderModel.setProperty("/DeliveringPlantID", "");
            oOrderModel.setProperty("/SelectedProducts", []);
            oTable.removeSelections();

            // Mark that the user confirmed the save
            bConfirmed = true;

            // Navigate back to the main view
            const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("RouteMainView");

            // Close the dialog
            oConfirmDialog.close();
          }.bind(this)
        }),

        // If user clicks "No", just close the dialog
        endButton: new sap.m.Button({
          text: "No",
          press: function () {
            oConfirmDialog.close();
          }
        }),

        // After the dialog closes, show a success message only if the user confirmed
        afterClose: function () {
          oConfirmDialog.destroy();
          if (bConfirmed) {
            sap.m.MessageToast.show(`The order ${sOrderNumber} has been successfully created.`);
          }
        }
      });

      // Open the confirmation dialog
      oConfirmDialog.open();
    },

    _generateOrderNumber: function () {
      const sDate = this._getCurrentDate().replace(/-/g, "");
      const sRandom = Math.random().toString(36).substring(2, 6).toUpperCase();
      return `ORD-${sDate}-${sRandom}`;
    },

    _getCurrentDate: function () {
      const oDate = new Date();
      return oDate.toISOString().split("T")[0];
    }

  });
});