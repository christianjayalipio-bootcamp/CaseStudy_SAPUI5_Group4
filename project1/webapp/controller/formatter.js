sap.ui.define([], function () {
  "use strict";

  return {
    statusState: function (sStatus) {
      switch (sStatus) {
        case "Created": return "None";
        case "Released": return "Warning";
        case "Partially Completed":
        case "Completed": return "Information";
        case "Delivered": return "Success";
        default: return "None";
      }
    },

    formatOrderDate: function (sDate) {
      if (!sDate) return "";
      var oDate = sDate instanceof Date ? sDate : new Date(sDate);

      var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
        pattern: "dd-MMM-yyyy"
      });
      return oDateFormat.format(oDate);
    },

    calculateTotalPrice: function (fPricePerQuantity, iQuantity) {
      var fPrice = parseFloat(fPricePerQuantity) || 0;
      var iQty = parseInt(iQuantity, 10) || 0;

      var fTotal = fPrice * iQty;
      return fTotal.toFixed(2);
    },

    formatPlant: function (sPlantID) {
      const oModel = sap.ui.getCore().getModel("ordersModel");
      const aPlants = oModel?.getProperty("/Plants") || [];

      const oPlant = aPlants.find(p => p.PlantID === sPlantID);
      if (oPlant) {
        return `${oPlant.PlantCode} - ${oPlant.Description}`;
      }
      return sPlantID || "";
    }
  };
});
