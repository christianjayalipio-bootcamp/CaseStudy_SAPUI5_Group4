sap.ui.define([
    "sap/ui/core/UIComponent",
    "com/ui5/trng/project1/model/models"
], (UIComponent, models) => {
    "use strict";

    return UIComponent.extend("com.ui5.trng.project1.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // set the shared orders model
            const oOrdersModel = new sap.ui.model.json.JSONModel("/localService/mainService/data/Orders.json");
            this.setModel(oOrdersModel, "ordersModel");
            sap.ui.getCore().setModel(oOrdersModel, "ordersModel");

            // enable routing
            this.getRouter().initialize();
        }
    });
});