sap.ui.define([
  "sap/ui/core/UIComponent",
  "com/ui5/trng/project1/model/models",
  "sap/ui/core/util/MockServer"
], function(UIComponent, models, MockServer) {
  "use strict";
  return UIComponent.extend("com.ui5.trng.project1.Component", {
    metadata: { manifest: "json" },
    init: function() {
      // start mock server
      var oMockServer = new MockServer({
        rootUri: "/here/goes/your/serviceurl/"
      });
      oMockServer.simulate("localService/metadata.xml", {
        sMockdataBaseUrl: "localService/data"
      });
      oMockServer.start();

      UIComponent.prototype.init.apply(this, arguments);
      this.setModel(models.createDeviceModel(), "device");
      this.getRouter().initialize();
    }
  });
});
