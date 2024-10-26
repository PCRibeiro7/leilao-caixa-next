import useMediaQuery from "./useMediaQuery";

/**
 * Get a set of boolean representing which breakpoint is active
 * and which breakpoints are inactive.
 *
 * Inspired by: https://github.com/contra/react-responsive/issues/162#issuecomment-592082035
 */
export default function useBreakpoints() {
    const breakpoints = {
        isXs: true,
        isSm: useMediaQuery("(min-width: 641px)"),
        isMd: useMediaQuery("(min-width: 769px)"),
        isLg: useMediaQuery("(min-width: 1025px)"),
        active: "xs",
    };
    if (breakpoints.isXs) breakpoints.active = "xs";
    if (breakpoints.isSm) breakpoints.active = "sm";
    if (breakpoints.isMd) breakpoints.active = "md";
    if (breakpoints.isLg) breakpoints.active = "lg";
    return breakpoints;
}
