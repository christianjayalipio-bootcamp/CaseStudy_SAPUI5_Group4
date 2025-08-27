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
                pattern: "dd MMM yyyy"
            });
            return oDateFormat.format(oDate);
        },
        calculateTotalPrice: function (fPricePerQuantity, iQuantity) {
            var fPrice = parseFloat(fPricePerQuantity) || 0;
            var iQty = parseInt(iQuantity, 10) || 0;

            var fTotal = fPrice * iQty;

            return Math.floor(fTotal).toString();
        },
        formatPlant: function (sPlantCode) {
            const plantMap = {
                "PL001": "Newcastle Plant",
                "PL002": "London Warehouse",
                "PL003": "Manchester Warehouse",
                "PL004": "Birmingham Warehouse",
                "PL005": "Leeds Facility",
                "PL006": "Glasgow Facility",
                "PL007": "Liverpool Center",
                "PL008": "Sheffield Center",
                "PL009": "Bristol Depot",
                "PL010": "Edinburgh Depot"
            };
            if(plantMap[sPlantCode]) {
                return sPlantCode + "-" + plantMap[sPlantCode];
            }
            return plantMap[sPlantCode] || sPlantCode;
        }
    };
});
