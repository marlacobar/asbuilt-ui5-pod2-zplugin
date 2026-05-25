sap.ui.define([
    "sap/m/library",
    "sap/ui/core/library",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/dm/dme/pod2/api/ApiClient",
    "sap/dm/dme/pod2/api/RestClient",
    "sap/dm/dme/pod2/api/ApiPaths",
    "sap/base/security/encodeURL",
    "sap/dm/dme/pod2/api/mdo/MDO",
    "sap/dm/dme/pod2/api/odata/ODataV4Client"
], function (MobileLibrary, SapUiCoreLibrary, JSONModel, Controller, History, ApiClient, RestClient, ApiPaths, encodeURL, MDO, ODataV4Client) {
    'use strict';

    const { Fragment, Priority } = SapUiCoreLibrary;
    const { MessageBox, MessageToast, Button } = MobileLibrary;
    const oMdoClient = ODataV4Client.getMdoClient();

    return {
        getOrder: async function (sPlant, sOrder) {
            let oParams = {
                plant: sPlant,
                order: sOrder
            };

            let ordersList = await ApiClient.order.getOrder(oParams);
            return ordersList;
        },

        getWorkCenters: async function (sPlant, sWorkCenter = "") {
            const oParams = {
                plant: sPlant
            };

            let mapWorkCenters = new Map();
            let aWorkCenterList = await ApiClient.workcenter.getWorkCenters(oParams);

            aWorkCenterList.forEach((oWorkCenter) => {
                mapWorkCenters.set(oWorkCenter.workCenter, oWorkCenter)
            });

            if (sWorkCenter) return mapWorkCenters.get(sWorkCenter);

            return mapWorkCenters;
        },

        getResources: async function (sPlant, sResource = "") {
            const oParams = {
                plant: sPlant
            };

            let mapResources = new Map();
            let aResourceList = await ApiClient.resource.getResources(oParams);

            aResourceList.forEach((oResource) => {
                mapResources.set(oResource.resource, oResource)
            });

            if (sResource) return mapResources.get(sResource);

            return mapResources;
        },

        getRouting: async function (sPlant, oRouting) {
            let sUrl = `${ApiPaths.API_GATEWAY_MS_PATH}/routing/v1/routings/routingSteps`;
            let oParameters = {
                plant: sPlant,
                routing: oRouting.routing,
                type: oRouting.type,
                version: oRouting.version
            };

            let oRoutingDetails = await RestClient.get(sUrl, oParameters);

            return oRoutingDetails.routingSteps;
        },

        /**
         * Retrieves SFC data from the exposed Production Process API: P_AsBuiltDataReport_GetSfcData.
         *
         * @function getPPSfcData
         * @param {Object} oParams - Input parameters for the PP API call.
         * @param {string} oParams.IN_SITE - The site identifier where the PP is executed.
         * @param {string} oParams.IN_SFC - The Shop Floor Control (SFC) identifier to query.
         * @returns {Promise<Object>} A promise that resolves with the SFC data returned by the PP API.
         *
         * @example
         * this.Commons.getPPSfcData({ IN_SITE: "MFG01", IN_SFC: "SFC12345" });
         */
        getSfcDetail: async function (oParams) {
            const sApiPath = '/pe/api/v1/process/processDefinitions/start?key=REG_abce480f-fd10-4dde-945f-0594d273a550&async=false',
                sUrl = `${ApiPaths.API_GATEWAY_MS_PATH}${sApiPath}`;

            const response = await RestClient.post(sUrl, oParams);
            const oData = JSON.parse(response.sOutput);

            return oData;
        },

        getMaterialText: async function (oRequest) {
            const sFilter = this._objectToODataFilterString({
                PLANT: oRequest.plant,
                MATERIAL: oRequest.material
            });

            const oParameters = {
                $skip: oRequest.skip || 0,
                $top: oRequest.top || 1,
                $filter: sFilter,
                $select: "DESCRIPTION",
            };
            const [[aResponse]] = await oMdoClient.getPage(MDO.MaterialText, oParameters);
            return aResponse?.DESCRIPTION ?? '';
        },

        /**
         * Retrieves SFC assembly event records from the MDO service.
         *
         * Optionally updates or creates a JSON model in the current view
         * with the retrieved response data.
         *
         * @async
         * @function getSFCAssemblyEvents
         * @param {object} oRequest Request parameters.
         * @param {string} oRequest.plant Plant identifier.
         * @param {string} oRequest.sfc SFC identifier.
         * @param {number} [oRequest.skip=0] Number of records to skip.
         * @returns {Promise<object[]>} Promise resolving to an array of SFC assembly event records.
         */
        getSfcAssemblyEvents: async function (oRequest) {
            const bRemoved = oRequest.componentState === 'Removed' ? 'COMPONENT_REMOVE' : undefined;
            
            const sFilter = this._objectToODataFilterString({
                PLANT: oRequest.plant,
                SFC: oRequest.sfc,
                EVENT_TYPE: bRemoved
            });

            const oParameters = {
                $skip: oRequest.skip || 0,
                $top: oRequest.top || 1000,
                $filter: sFilter,
                $select: `BOM_COMPONENT_MATERIAL,BOM_COMPONENT_MATERIAL_VERSION,BOM_COMPONENT_SEQUENCE,
                        QUANTITY_IN_BASE_UOM,BASE_UOM,QUANTITY_IN_REPORTED_UOM,REPORTED_UOM,
                        OPERATION_ACTIVITY,USER_ID,EVENT_TYPE,EVENT_OCCURRED_AT`,
                $orderby: "EVENT_OCCURRED_AT desc"
            };

            const [aResponse] = await oMdoClient.getPage(MDO.SFCAssemblyEvents, oParameters);

            // Normalize numeric fields
            aResponse.forEach((oItem) => {
                oItem.BOM_COMPONENT_SEQUENCE = parseInt(oItem.BOM_COMPONENT_SEQUENCE, 10);
                oItem.QUANTITY_IN_BASE_UOM = parseFloat(oItem.QUANTITY_IN_BASE_UOM);
                oItem.QUANTITY_IN_REPORTED_UOM = parseFloat(oItem.QUANTITY_IN_REPORTED_UOM);
            });

            return aResponse;
        },

        getSfcAssemblyDataField: async function (oRequest) {
            const sFilter = this._objectToODataFilterString({
                PLANT: oRequest.plant,
                SFC: oRequest.sfc,
                SFC_ASSEMBLY_EVENT_ID: oRequest.sfcAssyEventId
            });

            const oParameters = {
                $skip: oRequest.skip || 0,
                $top: oRequest.top || 1000,
                $filter: sFilter,
                $select: `*`,
                //COMPONENT_INVENTORY,DATA_FIELD_LABEL,DATA_FIELD_VALUE,IS_DELETED
            };

            const [aResponse] = await oMdoClient.getPage(MDO.SFCAssemblyDataField, oParameters);

            return aResponse;
        },

        getAssembledComponents: async function (oRequest, oBomComponents, oModel) {
            try {
                const aData = await this.getSfcAssemblyEvents(oRequest);
                let oTemporalData = { ...oBomComponents, components: [] };

                await Promise.all(
                    oBomComponents.components.map(async (c) => {
                        const { component, version, sequence } = c.bomComponent;

                        const aActualComponents = aData.filter(item =>
                            item.BOM_COMPONENT_MATERIAL === component &&
                            item.BOM_COMPONENT_MATERIAL_VERSION === version &&
                            item.BOM_COMPONENT_SEQUENCE === sequence
                        );

                        const enriched = await Promise.all(
                            aActualComponents.map(async (a) => {
                                // try {
                                    const description = await this.getMaterialText({
                                        plant: oRequest.plant,
                                        material: a.BOM_COMPONENT_MATERIAL
                                    });

                                    const oParams = {
                                        plant: oRequest.plant,
                                        sfc: oRequest.sfc,
                                        sfcAssyEventId: a.ID
                                    };
                                    const oDataFields = await this.getSfcAssemblyDataField(oParams);

                                    return {
                                        ...a,
                                        MATERIAL_DESCRIPTION: description,
                                        DATA_FIELDS: oDataFields ?? []
                                    };
                                // } catch (err) {
                                //     console.error(err);
                                //     throw err;
                                // }
                            })
                        );

                        c.actualComponents = enriched;


                        // -------------------------------
                        // componentState Filter
                        // -------------------------------
                        let include = false;

                        switch (oRequest.componentState) {
                            case "All":
                                include = true;
                                break;

                            case "Assembled":
                                const assembled = c.actualComponents.filter(a => a.EVENT_TYPE !== "COMPONENT_REMOVE");
                                if (assembled.length > 0) {
                                    c.actualComponents = assembled;
                                    include = true;
                                }
                                break;

                            case "Unassembled":
                                include = c.actualComponents.length === 0;
                                break;

                            case "AssembledUnassembled":
                                const assembledUnassembled = c.actualComponents.filter(a => a.EVENT_TYPE !== "COMPONENT_REMOVE");
                                if (c.actualComponents.length === 0 || assembledUnassembled.length > 0) {
                                    c.actualComponents = assembledUnassembled;
                                    include = true;
                                }
                                break;

                            case "Removed":
                                const removed = c.actualComponents.filter(a => a.EVENT_TYPE === "COMPONENT_REMOVE");
                                if (removed.length > 0) {
                                    c.actualComponents = removed;
                                    include = true;
                                }
                                break;
                        }

                        if (include) {
                            oTemporalData.components.push(c);
                        }

                        oModel.setData(oTemporalData);
                        oModel.refresh(true);

                        // if (oRequest.componentState === 'Removed') {
                        //     if (c.actualComponents.length > 0) oTemporalData.components.push(c);
                        //     oModel.setData(oTemporalData);
                        //     oModel.refresh(true);
                        // }
                    })
                );

            } catch (oError) {
                MessageToast.show(oError.message);
            }
        },


        _objectToODataFilterString(oFilterMap) {
            return Object.entries(oFilterMap)
                .filter(([sKey, sValue]) => typeof sValue !== "undefined")
                .map(([sKey, sValue]) => `${sKey} eq ${quoteString(sValue)}`)
                .join(" and ");

            /**
             * Conditionally adds quotes around strings, accounting for null values.
             * @param {string|null} vValue
             * @returns {string}
             */
            function quoteString(vValue) {
                if (typeof vValue === "string") {
                    return `'${vValue}'`;
                }
                return vValue;
            }
        },
    }
});