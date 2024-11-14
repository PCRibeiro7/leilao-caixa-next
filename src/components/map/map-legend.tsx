import { GeocodePrecision } from "@/types/Property";
import ToArray from "@/utils/enumToArray";
import { Control, DomUtil, Map } from "leaflet";
import { useEffect } from "react";
import { mapGeocodePrecisionToColor, mapGeocodePrecisionToDisplay } from "../filter";

type Props = {
    map: Map | null;
};

function Legend({ map }: Props) {
    useEffect(() => {
        if (map) {
            const legend = new Control({ position: "bottomleft" });

            legend.onAdd = () => {
                const div = DomUtil.create(
                    "div",
                    "bg-white px-2 py-1.5 rounded-[5px] text-left leading-[18px] text-[#555] flex flex-col space-y-1 !ml-[4px] md:!ml-[10px] !mb-[44px] md:!mb-[10px] "
                );
                const geocodePrecisions = ToArray(GeocodePrecision) as GeocodePrecision[];
                const content = geocodePrecisions.map(
                    (precision) =>
                        '<div><i style="background: ' +
                        mapGeocodePrecisionToColor[precision] +
                        '" class="rounded-full w-[18px] h-[18px] float-left mr-2"></i> ' +
                        mapGeocodePrecisionToDisplay[precision] +
                        "</div>"
                );
                div.innerHTML = '<p class="text-md font-bold mb-2">Precisão da Localização:</p>' + content.join("");

                return div;
            };
            legend.addTo(map);
        }
    }, [map]);
    return null;
}

export default Legend;
