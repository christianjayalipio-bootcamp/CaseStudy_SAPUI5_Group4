sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "com/ui5/trng/project1/controller/formatter"
], function(Controller, UIComponent, formatter) {
    "use strict";

    return Controller.extend("com.ui5.trng.project1.controller.DetailsOrder", {
        formatter: formatter,

        onInit: function () {
            // Attach to route pattern to get parameter
            var oRouter = UIComponent.getRouterFor(this);
            oRouter.getRoute("RouteDetailsOrder").attachPatternMatched(this._onObjectMatched, this);
        },

        onEditPress: function() {
            // handle edit logic here
        },

        onCancelPress: function() {
            // navigate back to main view
            var oRouter = UIComponent.getRouterFor(this);
            oRouter.navTo("RouteMainView");
        },
        _onObjectMatched: function (oEvent) {
    var sOrderPath = decodeURIComponent(oEvent.getParameter("arguments").orderPath);

    this.getView().bindElement({
        path: "/" + sOrderPath,
        events: {
            dataRequested: function () {
                this.getView().setBusy(true);
            }.bind(this),
            dataReceived: function () {
                this.getView().setBusy(false);
            }.bind(this)
        }
    });
}


    });
});
