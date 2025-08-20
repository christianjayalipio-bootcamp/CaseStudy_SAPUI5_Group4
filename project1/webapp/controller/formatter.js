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

            // Convert string or Date to Date object
            var oDate = sDate instanceof Date ? sDate : new Date(sDate);

            // Use DateFormat
            var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
                pattern: "dd-MMM-yyyy"
            });
            return oDateFormat.format(oDate);
        }
    };
});
