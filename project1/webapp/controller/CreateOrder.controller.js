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

            // Reset selected products and table
            oOrderModel.setProperty("/SelectedProducts", []);
            const oTable = this.byId("productTable");
            if (oTable) {
              oTable.removeSelections();
            }

            // Re-filter products for the new plant
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
          new Label({ text: "Quantity", required: true }),
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
              ProductID: oSelectedProduct.ProductID,
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

      const iCount = aSelectedItems.length;

      if (iCount === 0) {
        MessageToast.show("Please select an item from the table.");
        return;
      }

      const oConfirmDialog = new sap.m.Dialog({
        title: "Confirm Delete",
        type: "Message",
        content: new sap.m.Text({ text: `Are you sure you want to delete ${iCount} item${iCount > 1 ? "s" : ""}?` }),
        beginButton: new sap.m.Button({
          text: "Yes",
          type: "Emphasized",
          press: function () {
            const oOrderModel = this.getView().getModel("orderModel");
            const aProducts = oOrderModel.getProperty("/SelectedProducts");
            const aToDelete = aSelectedItems.map(item => item.getBindingContext("orderModel").getObject());
            const aRemaining = aProducts.filter(product => !aToDelete.includes(product));

            oOrderModel.setProperty("/SelectedProducts", aRemaining);
            oTable.removeSelections();

            oConfirmDialog.close();
            MessageToast.show(`${iCount} item${iCount > 1 ? "s" : ""} deleted.`);
          }.bind(this)
        }),
        endButton: new sap.m.Button({
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
      const oOrderModel = this.getView().getModel("orderModel");
      const oOrdersModel = this.getView().getModel("ordersModel");

      const sReceivingPlant = oOrderModel.getProperty("/ReceivingPlantID");
      const sDeliveringPlant = oOrderModel.getProperty("/DeliveringPlantID");

      const oTable = this.byId("productTable");
      const aSelectedItems = oTable.getSelectedItems();
      const aSelectedProducts = aSelectedItems.map(item =>
        item.getBindingContext("orderModel").getObject()
      );

      if (!sReceivingPlant || !sDeliveringPlant || aSelectedProducts.length === 0) {
        MessageToast.show("Please complete all required fields and select at least one product.");
        return;
      }

      const sOrderNumber = this._generateOrderNumber();
      const sCreationDate = this._getCurrentDate();

      const oNewOrder = {
        OrderNumber: sOrderNumber,
        CreationDate: sCreationDate,
        DeliveringPlantID: sDeliveringPlant,
        ReceivingPlantID: sReceivingPlant,
        Status: "Created"
      };

      const oConfirmDialog = new sap.m.Dialog({
        title: "Confirm Save",
        type: "Message",
        content: new sap.m.Text({ text: "Are you sure you want to save these changes?" }),
        beginButton: new sap.m.Button({
          text: "Yes",
          type: "Emphasized",
          press: function () {
            // Save order
            const aOrders = oOrdersModel.getProperty("/Orders") || [];
            aOrders.push(oNewOrder);
            oOrdersModel.setProperty("/Orders", aOrders);

            // Save products
            const aOrderProducts = oOrdersModel.getProperty("/OrderProducts") || [];
            aSelectedProducts.forEach((product, index) => {
              aOrderProducts.push({
                OrderProductID: `OP${Date.now()}${index}`,
                OrderNumber: sOrderNumber,
                ProductID: product.ProductID,
                Quantity: product.Quantity,
                TotalPrice: parseFloat(product.TotalPrice)
              });
            });
            oOrdersModel.setProperty("/OrderProducts", aOrderProducts);

            // Remove only selected products from SelectedProducts
            const aAllProducts = oOrderModel.getProperty("/SelectedProducts") || [];
            const aRemainingProducts = aAllProducts.filter(product =>
              !aSelectedProducts.some(selected => selected.ProductID === product.ProductID)
            );
            oOrderModel.setProperty("/SelectedProducts", aRemainingProducts);
            oTable.removeSelections();


            oConfirmDialog.close();

            // ✅ Show success dialog
            const oSuccessDialog = new sap.m.Dialog({
              title: "Order Created",
              type: "Message",
              content: new sap.m.Text({ text: `The order ${sOrderNumber} has been successfully created.` }),
              beginButton: new sap.m.Button({
                text: "OK",
                type: "Emphasized",
                press: function () {
                  oSuccessDialog.close();
                  const oRouter = UIComponent.getRouterFor(this);
                  oRouter.navTo("RouteMainView");
                }.bind(this)
              }),
              afterClose: function () {
                oSuccessDialog.destroy();
              }
            });

            oSuccessDialog.open();
          }.bind(this)
        }),
        endButton: new sap.m.Button({
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

    // Sequential Order Number Generator
    _generateOrderNumber: function () {
      const oOrdersModel = this.getView().getModel("ordersModel");
      const aOrders = oOrdersModel.getProperty("/Orders") || [];

      const aSorted = aOrders.slice().sort((a, b) => {
        const numA = parseInt(a.OrderNumber.replace("ORD", ""), 10);
        const numB = parseInt(b.OrderNumber.replace("ORD", ""), 10);
        return numA - numB;
      });

      const sLastOrderNumber = aSorted.length > 0
        ? aSorted[aSorted.length - 1].OrderNumber
        : "OR000";

      const iLastNumber = parseInt(sLastOrderNumber.replace("ORD", ""), 10);
      const sNextOrderNumber = "ORD" + String(iLastNumber + 1).padStart(3, "0");

      return sNextOrderNumber;
    },

    _getCurrentDate: function () {
      const oDate = new Date();
      return oDate.toISOString().split("T")[0];
    }

  });
});
