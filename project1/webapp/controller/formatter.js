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

            return Math.floor(fTotal).toString();
        },
        formatPlant: function (sPlantCode) {
            const plantMap = {
                "9101": "USA",
                "9102": "Canada",
                "9103": "Mexico",
                "9104": "Brazil",
                "9105": "Argentina",
                "9106": "UK",
                "9107": "France",
                "9108": "Germany",
                "9109": "Italy",
                "9110": "Japan"
            };
            if(plantMap[sPlantCode]) {
                return sPlantCode + "-" + plantMap[sPlantCode];
            }
            return plantMap[sPlantCode] || sPlantCode;
        }

    };
});
