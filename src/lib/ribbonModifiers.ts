// Auto-generated from medals.pl modifier scrape
// Maps ribbon base URL -> array of modifier definitions

export interface RibbonModifierOption {
  value: string;
  label: string;
  url: string;
}

export interface RibbonModifier {
  type: 'select' | 'checkbox';
  name: string;
  label: string;
  options?: RibbonModifierOption[];
  tooltip?: string;
  variantUrl?: string;
  affectsImage?: boolean;
}

export function getRibbonModifiers(url: string): RibbonModifier[] {
  return RIBBON_MODIFIERS[url] ?? [];
}

const RIBBON_MODIFIERS: Record<string, RibbonModifier[]> = {
  "https://www.medals.pl/bc/r/au2ccs.gif": [
    { type: 'select', name: "au2ccs", label: 'Select variant', tooltip: "au2ccs", options: [{ value: "1", label: "Award", url: "https://www.medals.pl/bc/r/au2ccs.gif" }, { value: "2", label: "1 Bar", url: "https://www.medals.pl/bc/r/au2ccs1.gif" }, { value: "3", label: "2 Bars", url: "https://www.medals.pl/bc/r/au2ccs2.gif" }] },
  ],
  "https://www.medals.pl/bc/r/au2cds.gif": [
    { type: 'select', name: "au2cds", label: 'Select variant', tooltip: "au2cds", options: [{ value: "1", label: "Award", url: "https://www.medals.pl/bc/r/au2cds.gif" }, { value: "2", label: "1 Bar", url: "https://www.medals.pl/bc/r/au2cds1.gif" }, { value: "3", label: "2 Bars", url: "https://www.medals.pl/bc/r/au2cds2.gif" }] },
  ],
  "https://www.medals.pl/bc/r/au2cns.gif": [
    { type: 'select', name: "au2cns", label: 'Select variant', tooltip: "au2cns", options: [{ value: "1", label: "1", url: "https://www.medals.pl/bc/r/au2cns.gif" }, { value: "2", label: "2", url: "https://www.medals.pl/bc/r/au2cns1.gif" }, { value: "3", label: "3", url: "https://www.medals.pl/bc/r/au2cns2.gif" }] },
  ],
  "https://www.medals.pl/bc/r/au2drf.gif": [
    { type: 'select', name: "au2drf", label: 'Select variant', tooltip: "au2drf", options: [{ value: "1", label: "Award", url: "https://www.medals.pl/bc/r/au2drf.gif" }, { value: "2", label: "1 Clasp", url: "https://www.medals.pl/bc/r/au2drf1.gif" }, { value: "3", label: "2 Clasps", url: "https://www.medals.pl/bc/r/au2drf2.gif" }, { value: "4", label: "3 Clasps", url: "https://www.medals.pl/bc/r/au2drf3.gif" }, { value: "5", label: "4 Clasps", url: "https://www.medals.pl/bc/r/au2drf4.gif" }, { value: "6", label: "5 Clasps", url: "https://www.medals.pl/bc/r/au2drf5.gif" }, { value: "7", label: "6 Clasps", url: "https://www.medals.pl/bc/r/au2drf6.gif" }, { value: "8", label: "7 Clasps", url: "https://www.medals.pl/bc/r/au2drf7.gif" }] },
  ],
  "https://www.medals.pl/bc/r/au2maa.gif": [
    { type: 'select', name: "au2maa", label: 'Select variant', tooltip: "au2maa", options: [{ value: "1", label: "1", url: "https://www.medals.pl/bc/r/au2maa.gif" }, { value: "2", label: "2", url: "https://www.medals.pl/bc/r/au2maa1.gif" }, { value: "3", label: "3", url: "https://www.medals.pl/bc/r/au2maa2.gif" }] },
  ],
  "https://www.medals.pl/bc/r/au2mbr1.gif": [
    { type: 'checkbox', name: "w_bar", label: "w. bar", variantUrl: "https://www.medals.pl/bc/r/au2mbr2.gif", affectsImage: true },
  ],
  "https://www.medals.pl/bc/r/au2mcs.gif": [
    { type: 'select', name: "au2mcs", label: 'Select variant', tooltip: "au2mcs", options: [{ value: "1", label: "Award", url: "https://www.medals.pl/bc/r/au2mcs.gif" }, { value: "2", label: "1 Bar", url: "https://www.medals.pl/bc/r/au2mcs1.gif" }, { value: "3", label: "2 Bars", url: "https://www.medals.pl/bc/r/au2mcs2.gif" }] },
  ],
  "https://www.medals.pl/bc/r/au2mdfs.gif": [
    { type: 'select', name: "au2mdfs", label: 'Select variant', tooltip: "au2mdfs", options: [{ value: "1", label: "1", url: "https://www.medals.pl/bc/r/au2mdfs.gif" }, { value: "2", label: "2", url: "https://www.medals.pl/bc/r/au2mdfs1.gif" }, { value: "3", label: "3", url: "https://www.medals.pl/bc/r/au2mdfs2.gif" }, { value: "4", label: "4", url: "https://www.medals.pl/bc/r/au2mdfs3.gif" }, { value: "5", label: "5", url: "https://www.medals.pl/bc/r/au2mdfs4.gif" }, { value: "6", label: "6", url: "https://www.medals.pl/bc/r/au2mdfs5.gif" }, { value: "7", label: "7", url: "https://www.medals.pl/bc/r/au2mdfs6.gif" }, { value: "8", label: "8", url: "https://www.medals.pl/bc/r/au2mdfs7.gif" }] },
  ],
  "https://www.medals.pl/bc/r/au2mds.gif": [
    { type: 'select', name: "au2mds", label: 'Select variant', tooltip: "au2mds", options: [{ value: "1", label: "Award", url: "https://www.medals.pl/bc/r/au2mds.gif" }, { value: "2", label: "1 Bar", url: "https://www.medals.pl/bc/r/au2mds1.gif" }, { value: "3", label: "2 Bars", url: "https://www.medals.pl/bc/r/au2mds2.gif" }] },
  ],
  "https://www.medals.pl/bc/r/au2mga.gif": [
    { type: 'select', name: "au2mga", label: 'Select variant', tooltip: "au2mga", options: [{ value: "1", label: "Award", url: "https://www.medals.pl/bc/r/au2mga.gif" }, { value: "2", label: "1 Bar", url: "https://www.medals.pl/bc/r/au2mga1.gif" }, { value: "3", label: "2 Bars", url: "https://www.medals.pl/bc/r/au2mga2.gif" }] },
  ],
  "https://www.medals.pl/bc/r/au2mlsd.gif": [
    { type: 'select', name: "au2mlsd", label: 'Select variant', tooltip: "au2mlsd", options: [{ value: "1", label: "Award", url: "https://www.medals.pl/bc/r/au2mlsd.gif" }, { value: "2", label: "1 Clasp", url: "https://www.medals.pl/bc/r/au2mlsd1.gif" }, { value: "3", label: "2 Clasps", url: "https://www.medals.pl/bc/r/au2mlsd2.gif" }, { value: "4", label: "3 Clasps", url: "https://www.medals.pl/bc/r/au2mlsd3.gif" }, { value: "5", label: "4 Clasps", url: "https://www.medals.pl/bc/r/au2mlsd4.gif" }, { value: "6", label: "5 Clasps", url: "https://www.medals.pl/bc/r/au2mlsd5.gif" }, { value: "7", label: "6 Clasps", url: "https://www.medals.pl/bc/r/au2mlsd6.gif" }, { value: "8", label: "7 Clasps", url: "https://www.medals.pl/bc/r/au2mlsd7.gif" }] },
  ],
  "https://www.medals.pl/bc/r/au2mpoov.gif": [
    { type: 'select', name: "au2mpoov", label: 'Select variant', tooltip: "au2mpoov", options: [{ value: "1", label: "1", url: "https://www.medals.pl/bc/r/au2mpoov.gif" }, { value: "2", label: "2", url: "https://www.medals.pl/bc/r/au2mpoov1.gif" }, { value: "3", label: "3", url: "https://www.medals.pl/bc/r/au2mpoov2.gif" }, { value: "4", label: "4", url: "https://www.medals.pl/bc/r/au2mpoov3.gif" }] },
  ],
  "https://www.medals.pl/bc/r/au2mrf.gif": [
    { type: 'select', name: "au2mrf", label: 'Select variant', tooltip: "au2mrf", options: [{ value: "1", label: "Award", url: "https://www.medals.pl/bc/r/au2mrf.gif" }, { value: "2", label: "1 Clasp", url: "https://www.medals.pl/bc/r/au2mrf1.gif" }, { value: "3", label: "2 Clasps", url: "https://www.medals.pl/bc/r/au2mrf2.gif" }, { value: "4", label: "3 Clasps", url: "https://www.medals.pl/bc/r/au2mrf3.gif" }, { value: "5", label: "4 Clasps", url: "https://www.medals.pl/bc/r/au2mrf4.gif" }, { value: "6", label: "5 Clasps", url: "https://www.medals.pl/bc/r/au2mrf5.gif" }, { value: "7", label: "6 Clasps", url: "https://www.medals.pl/bc/r/au2mrf6.gif" }, { value: "8", label: "7 Clasps", url: "https://www.medals.pl/bc/r/au2mrf7.gif" }] },
  ],
  "https://www.medals.pl/bc/r/au2sco1.gif": [
    { type: 'checkbox', name: "w_bar", label: "w. bar", variantUrl: "https://www.medals.pl/bc/r/au2sco2.gif", affectsImage: true },
  ],
  "https://www.medals.pl/bc/r/au2sga.gif": [
    { type: 'select', name: "au2sga", label: 'Select variant', tooltip: "au2sga", options: [{ value: "1", label: "Award", url: "https://www.medals.pl/bc/r/au2sga.gif" }, { value: "2", label: "1 Bar", url: "https://www.medals.pl/bc/r/au2sga1.gif" }, { value: "3", label: "2 Bars", url: "https://www.medals.pl/bc/r/au2sga2.gif" }] },
  ],
  "https://www.medals.pl/bc/r/au2ucga1.gif": [
    { type: 'select', name: "au2ucga", label: 'Select variant', tooltip: "au2ucga", options: [{ value: "0", label: "0", url: "https://www.medals.pl/bc/r/au2ucga.gif" }, { value: "1", label: "1", url: "https://www.medals.pl/bc/r/au2ucga1.gif" }] },
  ],
  "https://www.medals.pl/bc/r/au2ucms1.gif": [
    { type: 'select', name: "au2ucms", label: 'Select variant', tooltip: "au2ucms", options: [{ value: "0", label: "0", url: "https://www.medals.pl/bc/r/au2ucms.gif" }, { value: "1", label: "1", url: "https://www.medals.pl/bc/r/au2ucms1.gif" }] },
  ],
  "https://www.medals.pl/bc/r/ca2cmsm.gif": [
    { type: 'select', name: "ca2cmsm", label: 'Select variant', tooltip: "ca2cmsm", options: [{ value: "1", label: "Award", url: "https://www.medals.pl/bc/r/ca2cmsm.gif" }, { value: "2", label: "1 Bar", url: "https://www.medals.pl/bc/r/ca2cmsm1.gif" }, { value: "3", label: "2 Bars", url: "https://www.medals.pl/bc/r/ca2cmsm2.gif" }] },
  ],
  "https://www.medals.pl/bc/r/ca2dcf.gif": [
    { type: 'select', name: "ca2dcf", label: 'Select variant', tooltip: "ca2dcf", options: [{ value: "1", label: "Award", url: "https://www.medals.pl/bc/r/ca2dcf.gif" }, { value: "2", label: "1 Clasp", url: "https://www.medals.pl/bc/r/ca2dcf1.gif" }, { value: "3", label: "2 Clasps", url: "https://www.medals.pl/bc/r/ca2dcf2.gif" }, { value: "4", label: "3 Clasps", url: "https://www.medals.pl/bc/r/ca2dcf3.gif" }, { value: "5", label: "4 Clasps", url: "https://www.medals.pl/bc/r/ca2dcf4.gif" }, { value: "6", label: "5 Clasps", url: "https://www.medals.pl/bc/r/ca2dcf5.gif" }] },
  ],
  "https://www.medals.pl/bc/r/ca2mbr.gif": [
    { type: 'select', name: "ca2mbr", label: 'Select variant', tooltip: "ca2mbr", options: [{ value: "1", label: "1", url: "https://www.medals.pl/bc/r/ca2mbr.gif" }, { value: "2", label: "2", url: "https://www.medals.pl/bc/r/ca2mbr1.gif" }, { value: "3", label: "3", url: "https://www.medals.pl/bc/r/ca2mbr2.gif" }] },
  ],
  "https://www.medals.pl/bc/r/ca2mgk1.gif": [
    { type: 'checkbox', name: "w_bar", label: "w. bar", variantUrl: "https://www.medals.pl/bc/r/ca2mgk1.gif", affectsImage: true },
    { type: 'checkbox', name: "MID", label: "MID", variantUrl: "https://www.medals.pl/bc/r/ca2mgk1.gif", affectsImage: false },
  ],
  "https://www.medals.pl/bc/r/ca2mgsaf.gif": [
    { type: 'select', name: "ca2mgsaf", label: 'Select variant', tooltip: "ca2mgsaf", options: [{ value: "z", label: "No clasp", url: "https://www.medals.pl/bc/r/ca2mgsaf.gif" }, { value: "1", label: "1 Clasp", url: "https://www.medals.pl/bc/r/ca2mgsaf1.gif" }, { value: "2", label: "2 Clasps", url: "https://www.medals.pl/bc/r/ca2mgsaf2.gif" }, { value: "3", label: "3 Clasps", url: "https://www.medals.pl/bc/r/ca2mgsaf3.gif" }, { value: "4", label: "4 Clasps", url: "https://www.medals.pl/bc/r/ca2mgsaf4.gif" }, { value: "5", label: "5 Clasps", url: "https://www.medals.pl/bc/r/ca2mgsaf5.gif" }, { value: "6", label: "6 Clasps", url: "https://www.medals.pl/bc/r/ca2mgsaf6.gif" }] },
    { type: 'checkbox', name: "MID", label: "MID", variantUrl: "https://www.medals.pl/bc/r/ca2mgsaf.gif", affectsImage: false },
  ],
  "https://www.medals.pl/bc/r/ca2mgsexp.gif": [
    { type: 'select', name: "ca2mgsexp", label: 'Select variant', tooltip: "ca2mgsexp", options: [{ value: "z", label: "No clasp", url: "https://www.medals.pl/bc/r/ca2mgsexp.gif" }, { value: "1", label: "1 Clasp", url: "https://www.medals.pl/bc/r/ca2mgsexp1.gif" }, { value: "2", label: "2 Clasps", url: "https://www.medals.pl/bc/r/ca2mgsexp2.gif" }, { value: "3", label: "3 Clasps", url: "https://www.medals.pl/bc/r/ca2mgsexp3.gif" }, { value: "4", label: "4 Clasps", url: "https://www.medals.pl/bc/r/ca2mgsexp4.gif" }, { value: "5", label: "5 Clasps", url: "https://www.medals.pl/bc/r/ca2mgsexp5.gif" }, { value: "6", label: "6 Clasps", url: "https://www.medals.pl/bc/r/ca2mgsexp6.gif" }] },
    { type: 'checkbox', name: "MID", label: "MID", variantUrl: "https://www.medals.pl/bc/r/ca2mgsexp.gif", affectsImage: false },
  ],
  "https://www.medals.pl/bc/r/ca2mgsswa.gif": [
    { type: 'select', name: "ca2mgsswa", label: 'Select variant', tooltip: "ca2mgsswa", options: [{ value: "z", label: "No clasp", url: "https://www.medals.pl/bc/r/ca2mgsswa.gif" }, { value: "1", label: "1 Clasp", url: "https://www.medals.pl/bc/r/ca2mgsswa1.gif" }, { value: "2", label: "2 Clasps", url: "https://www.medals.pl/bc/r/ca2mgsswa2.gif" }, { value: "3", label: "3 Clasps", url: "https://www.medals.pl/bc/r/ca2mgsswa3.gif" }, { value: "4", label: "4 Clasps", url: "https://www.medals.pl/bc/r/ca2mgsswa4.gif" }, { value: "5", label: "5 Clasps", url: "https://www.medals.pl/bc/r/ca2mgsswa5.gif" }, { value: "6", label: "6 Clasps", url: "https://www.medals.pl/bc/r/ca2mgsswa6.gif" }] },
    { type: 'checkbox', name: "MID", label: "MID", variantUrl: "https://www.medals.pl/bc/r/ca2mgsswa.gif", affectsImage: false },
  ],
  "https://www.medals.pl/bc/r/ca2mlsmp35.gif": [
    { type: 'select', name: "ca2mlsmp", label: 'Select variant', tooltip: "ca2mlsmp", options: [{ value: "1", label: "20 yrs", url: "https://www.medals.pl/bc/r/ca2mlsmp.gif" }, { value: "2", label: "25 yrs", url: "https://www.medals.pl/bc/r/ca2mlsmp25.gif" }, { value: "3", label: "30 yrs", url: "https://www.medals.pl/bc/r/ca2mlsmp30.gif" }, { value: "4", label: "35 yrs", url: "https://www.medals.pl/bc/r/ca2mlsmp35.gif" }] },
  ],
  "https://www.medals.pl/bc/r/ca2mmsm.gif": [
    { type: 'select', name: "ca2mmsm", label: 'Select variant', tooltip: "ca2mmsm", options: [{ value: "1", label: "Award", url: "https://www.medals.pl/bc/r/ca2mmsm.gif" }, { value: "2", label: "1 Bar", url: "https://www.medals.pl/bc/r/ca2mmsm1.gif" }, { value: "3", label: "2 Bars", url: "https://www.medals.pl/bc/r/ca2mmsm2.gif" }] },
  ],
  "https://www.medals.pl/bc/r/ca2mmv.gif": [
    { type: 'select', name: "ca2mmv", label: 'Select variant', tooltip: "ca2mmv", options: [{ value: "1", label: "Award", url: "https://www.medals.pl/bc/r/ca2mmv.gif" }, { value: "2", label: "1 Bar", url: "https://www.medals.pl/bc/r/ca2mmv1.gif" }, { value: "3", label: "2 Bars", url: "https://www.medals.pl/bc/r/ca2mmv2.gif" }] },
  ],
  "https://www.medals.pl/bc/r/ca2mosexp.gif": [
    { type: 'select', name: "ca2mosexp", label: 'Select variant', tooltip: "ca2mosexp", options: [{ value: "z", label: "No clasp", url: "https://www.medals.pl/bc/r/ca2mosexp.gif" }, { value: "1", label: "1 Clasp", url: "https://www.medals.pl/bc/r/ca2mosexp1.gif" }, { value: "2", label: "2 Clasps", url: "https://www.medals.pl/bc/r/ca2mosexp2.gif" }, { value: "3", label: "3 Clasps", url: "https://www.medals.pl/bc/r/ca2mosexp3.gif" }, { value: "4", label: "4 Clasps", url: "https://www.medals.pl/bc/r/ca2mosexp4.gif" }, { value: "5", label: "5 Clasps", url: "https://www.medals.pl/bc/r/ca2mosexp5.gif" }, { value: "6", label: "6 Clasps", url: "https://www.medals.pl/bc/r/ca2mosexp6.gif" }] },
  ],
  "https://www.medals.pl/bc/r/ca2moss.gif": [
    { type: 'select', name: "ca2moss", label: 'Select variant', tooltip: "ca2moss", options: [{ value: "z", label: "No clasp", url: "https://www.medals.pl/bc/r/ca2moss.gif" }, { value: "1", label: "1 Clasp", url: "https://www.medals.pl/bc/r/ca2moss1.gif" }, { value: "2", label: "2 Clasps", url: "https://www.medals.pl/bc/r/ca2moss2.gif" }, { value: "3", label: "3 Clasps", url: "https://www.medals.pl/bc/r/ca2moss3.gif" }, { value: "4", label: "4 Clasps", url: "https://www.medals.pl/bc/r/ca2moss4.gif" }, { value: "5", label: "5 Clasps", url: "https://www.medals.pl/bc/r/ca2moss5.gif" }, { value: "6", label: "6 Clasps", url: "https://www.medals.pl/bc/r/ca2moss6.gif" }] },
  ],
  "https://www.medals.pl/bc/r/ca2mosswa.gif": [
    { type: 'select', name: "ca2mosswa", label: 'Select variant', tooltip: "ca2mosswa", options: [{ value: "z", label: "No clasp", url: "https://www.medals.pl/bc/r/ca2mosswa.gif" }, { value: "1", label: "1 Clasp", url: "https://www.medals.pl/bc/r/ca2mosswa1.gif" }, { value: "2", label: "2 Clasps", url: "https://www.medals.pl/bc/r/ca2mosswa2.gif" }, { value: "3", label: "3 Clasps", url: "https://www.medals.pl/bc/r/ca2mosswa3.gif" }, { value: "4", label: "4 Clasps", url: "https://www.medals.pl/bc/r/ca2mosswa4.gif" }, { value: "5", label: "5 Clasps", url: "https://www.medals.pl/bc/r/ca2mosswa5.gif" }, { value: "6", label: "6 Clasps", url: "https://www.medals.pl/bc/r/ca2mosswa6.gif" }] },
  ],
  "https://www.medals.pl/bc/r/ca2msa.gif": [
    { type: 'select', name: "ca2msa", label: 'Select variant', tooltip: "ca2msa", options: [{ value: "z", label: "0", url: "https://www.medals.pl/bc/r/ca2msa.gif" }, { value: "1", label: "1", url: "https://www.medals.pl/bc/r/ca2msa1.gif" }, { value: "2", label: "2", url: "https://www.medals.pl/bc/r/ca2msa2.gif" }, { value: "3", label: "3", url: "https://www.medals.pl/bc/r/ca2msa3.gif" }, { value: "4", label: "4", url: "https://www.medals.pl/bc/r/ca2msa4.gif" }, { value: "5", label: "5", url: "https://www.medals.pl/bc/r/ca2msa5.gif" }, { value: "6", label: "6", url: "https://www.medals.pl/bc/r/ca2msa6.gif" }] },
  ],
  "https://www.medals.pl/bc/r/ca2mss.gif": [
    { type: 'select', name: "ca2mss", label: 'Select variant', tooltip: "ca2mss", options: [{ value: "1", label: "Award", url: "https://www.medals.pl/bc/r/ca2mss.gif" }, { value: "2", label: "1 Clasp", url: "https://www.medals.pl/bc/r/ca2mss1.gif" }, { value: "3", label: "2 Clasps", url: "https://www.medals.pl/bc/r/ca2mss2.gif" }, { value: "4", label: "3 Clasps", url: "https://www.medals.pl/bc/r/ca2mss3.gif" }] },
  ],
  "https://www.medals.pl/bc/r/ca2mswass.gif": [
    { type: 'select', name: "ca2mswas", label: 'Select variant', tooltip: "ca2mswas", options: [{ value: "z", label: "No clasp", url: "https://www.medals.pl/bc/r/ca2mswas.gif" }, { value: "1", label: "1 Clasp", url: "https://www.medals.pl/bc/r/ca2mswass1.gif" }, { value: "2", label: "2 Clasps", url: "https://www.medals.pl/bc/r/ca2mswass2.gif" }, { value: "3", label: "3 Clasps", url: "https://www.medals.pl/bc/r/ca2mswass3.gif" }, { value: "4", label: "4 Clasps", url: "https://www.medals.pl/bc/r/ca2mswass4.gif" }, { value: "5", label: "5 Clasps", url: "https://www.medals.pl/bc/r/ca2mswass5.gif" }, { value: "6", label: "6 Clasps", url: "https://www.medals.pl/bc/r/ca2mswass6.gif" }] },
    { type: 'checkbox', name: "w_\"AFGHANISTAN\"_bar", label: "w. \"AFGHANISTAN\" bar", variantUrl: "https://www.medals.pl/bc/r/ca2mswass.gif", affectsImage: true },
    { type: 'checkbox', name: "MID", label: "MID", variantUrl: "https://www.medals.pl/bc/r/ca2mswass.gif", affectsImage: false },
  ],
  "https://www.medals.pl/bc/r/ca2omm1.gif": [
    { type: 'select', name: "ca2omm", label: 'Select variant', tooltip: "1.Companion (CMM)\n2.Officer (OMM)\n3.Member (MMM)", options: [{ value: "1", label: "1", url: "https://www.medals.pl/bc/r/ca2omm1.gif" }, { value: "2", label: "2", url: "https://www.medals.pl/bc/r/ca2omma2.gif" }, { value: "3", label: "3", url: "https://www.medals.pl/bc/r/ca2omm3.gif" }] },
  ],
  "https://www.medals.pl/bc/r/ca2sco.gif": [
    { type: 'select', name: "ca2sco", label: 'Select variant', tooltip: "ca2sco", options: [{ value: "1", label: "1", url: "https://www.medals.pl/bc/r/ca2sco.gif" }, { value: "2", label: "2", url: "https://www.medals.pl/bc/r/ca2sco1.gif" }, { value: "3", label: "3", url: "https://www.medals.pl/bc/r/ca2sco2.gif" }] },
  ],
  "https://www.medals.pl/bc/r/ca2sgcaf.gif": [
    { type: 'select', name: "ca2sgcaf", label: 'Select variant', tooltip: "ca2sgcaf", options: [{ value: "z", label: "No clasp", url: "https://www.medals.pl/bc/r/ca2sgcaf.gif" }, { value: "1", label: "1 Clasp", url: "https://www.medals.pl/bc/r/ca2sgcaf1.gif" }, { value: "2", label: "2 Clasps", url: "https://www.medals.pl/bc/r/ca2sgcaf2.gif" }, { value: "3", label: "3 Clasps", url: "https://www.medals.pl/bc/r/ca2sgcaf3.gif" }, { value: "4", label: "4 Clasps", url: "https://www.medals.pl/bc/r/ca2sgcaf4.gif" }, { value: "5", label: "5 Clasps", url: "https://www.medals.pl/bc/r/ca2sgcaf5.gif" }, { value: "6", label: "6 Clasps", url: "https://www.medals.pl/bc/r/ca2sgcaf6.gif" }] },
  ],
  "https://www.medals.pl/bc/r/ca2sgcexp.gif": [
    { type: 'select', name: "ca2sgcexp", label: 'Select variant', tooltip: "ca2sgcexp", options: [{ value: "z", label: "No clasp", url: "https://www.medals.pl/bc/r/ca2sgcexp.gif" }, { value: "1", label: "1 Clasp", url: "https://www.medals.pl/bc/r/ca2sgcexp1.gif" }, { value: "2", label: "2 Clasps", url: "https://www.medals.pl/bc/r/ca2sgcexp2.gif" }, { value: "3", label: "3 Clasps", url: "https://www.medals.pl/bc/r/ca2sgcexp3.gif" }, { value: "4", label: "4 Clasps", url: "https://www.medals.pl/bc/r/ca2sgcexp4.gif" }, { value: "5", label: "5 Clasps", url: "https://www.medals.pl/bc/r/ca2sgcexp5.gif" }, { value: "6", label: "6 Clasps", url: "https://www.medals.pl/bc/r/ca2sgcexp6.gif" }] },
  ],
  "https://www.medals.pl/bc/r/ca2sgcswa.gif": [
    { type: 'select', name: "ca2sgcswa", label: 'Select variant', tooltip: "ca2sgcswa", options: [{ value: "z", label: "No clasp", url: "https://www.medals.pl/bc/r/ca2sgcswa.gif" }, { value: "1", label: "1 Clasp", url: "https://www.medals.pl/bc/r/ca2sgcswa1.gif" }, { value: "2", label: "2 Clasps", url: "https://www.medals.pl/bc/r/ca2sgcswa2.gif" }, { value: "3", label: "3 Clasps", url: "https://www.medals.pl/bc/r/ca2sgcswa3.gif" }, { value: "4", label: "4 Clasps", url: "https://www.medals.pl/bc/r/ca2sgcswa4.gif" }, { value: "5", label: "5 Clasps", url: "https://www.medals.pl/bc/r/ca2sgcswa5.gif" }, { value: "6", label: "6 Clasps", url: "https://www.medals.pl/bc/r/ca2sgcswa6.gif" }] },
  ],
  "https://www.medals.pl/bc/r/ca2smv.gif": [
    { type: 'select', name: "ca2smv", label: 'Select variant', tooltip: "ca2smv", options: [{ value: "1", label: "Award", url: "https://www.medals.pl/bc/r/ca2smv.gif" }, { value: "2", label: "1 Bar", url: "https://www.medals.pl/bc/r/ca2smv1.gif" }, { value: "3", label: "2 Bars", url: "https://www.medals.pl/bc/r/ca2smv2.gif" }] },
  ],
  "https://www.medals.pl/bc/r/nz2aarf.gif": [
    { type: 'select', name: "nz2aarf", label: 'Select variant', tooltip: "nz2aarf", options: [{ value: "1", label: "Award", url: "https://www.medals.pl/bc/r/nz2aarf.gif" }, { value: "2", label: "1 Bar", url: "https://www.medals.pl/bc/r/nz2aarf1.gif" }, { value: "3", label: "2 Bars", url: "https://www.medals.pl/bc/r/nz2aarf2.gif" }] },
  ],
  "https://www.medals.pl/bc/r/nz2dsd.gif": [
    { type: 'select', name: "nz2dsd", label: 'Select variant', tooltip: "nz2dsd", options: [{ value: "1", label: "Award", url: "https://www.medals.pl/bc/r/nz2dsd.gif" }, { value: "2", label: "1 Bar", url: "https://www.medals.pl/bc/r/nz2dsd1.gif" }, { value: "3", label: "2 Bars", url: "https://www.medals.pl/bc/r/nz2dsd2.gif" }] },
  ],
  "https://www.medals.pl/bc/r/nz2manz.gif": [
    { type: 'select', name: "nz2manz", label: 'Select variant', tooltip: "nz2manz", options: [{ value: "1", label: "1", url: "https://www.medals.pl/bc/r/nz2manz.gif" }, { value: "2", label: "2", url: "https://www.medals.pl/bc/r/nz2manz1.gif" }, { value: "3", label: "3", url: "https://www.medals.pl/bc/r/nz2manz2.gif" }] },
  ],
  "https://www.medals.pl/bc/r/nz2mlsp.gif": [
    { type: 'select', name: "nz2mlsp", label: 'Select variant', tooltip: "nz2mlsp", options: [{ value: "1", label: "1", url: "https://www.medals.pl/bc/r/nz2mlsp.gif" }, { value: "2", label: "2", url: "https://www.medals.pl/bc/r/nz2mlsp1.gif" }, { value: "3", label: "3", url: "https://www.medals.pl/bc/r/nz2mlsp2.gif" }, { value: "4", label: "4", url: "https://www.medals.pl/bc/r/nz2mlsp3.gif" }, { value: "5", label: "5", url: "https://www.medals.pl/bc/r/nz2mlsp4.gif" }] },
  ],
  "https://www.medals.pl/bc/r/nz2nzbd.gif": [
    { type: 'checkbox', name: "w_bar", label: "w. bar", variantUrl: "https://www.medals.pl/bc/r/nz2nzbd1.gif", affectsImage: true },
  ],
  "https://www.medals.pl/bc/r/nz2nzbm.gif": [
    { type: 'select', name: "nz2nzbm", label: 'Select variant', tooltip: "nz2nzbm", options: [{ value: "1", label: "Award", url: "https://www.medals.pl/bc/r/nz2nzbm.gif" }, { value: "2", label: "1 Bar", url: "https://www.medals.pl/bc/r/nz2nzbm1.gif" }, { value: "3", label: "2 Bars", url: "https://www.medals.pl/bc/r/nz2nzbm2.gif" }] },
  ],
  "https://www.medals.pl/bc/r/nz2nzbs.gif": [
    { type: 'checkbox', name: "w_bar", label: "w. bar", variantUrl: "https://www.medals.pl/bc/r/nz2nzbs1.gif", affectsImage: true },
  ],
  "https://www.medals.pl/bc/r/nz2nzgd.gif": [
    { type: 'checkbox', name: "w_bar", label: "w. bar", variantUrl: "https://www.medals.pl/bc/r/nz2nzgd1.gif", affectsImage: true },
  ],
  "https://www.medals.pl/bc/r/nz2nzgm.gif": [
    { type: 'select', name: "nz2nzgm", label: 'Select variant', tooltip: "nz2nzgm", options: [{ value: "1", label: "Award", url: "https://www.medals.pl/bc/r/nz2nzgm.gif" }, { value: "2", label: "1 Bar", url: "https://www.medals.pl/bc/r/nz2nzgm1.gif" }, { value: "3", label: "2 Bars", url: "https://www.medals.pl/bc/r/nz2nzgm2.gif" }] },
  ],
  "https://www.medals.pl/bc/r/nz2nzgs.gif": [
    { type: 'checkbox', name: "w_bar", label: "w. bar", variantUrl: "https://www.medals.pl/bc/r/nz2nzgs1.gif", affectsImage: true },
  ],
  "https://www.medals.pl/bc/r/nz2nzom.gif": [
    { type: 'select', name: "nz2nzom", label: 'Select variant', tooltip: "1.Knight/Dame Grand Companion (GNZM)\n2.Knight/Dame Companion (KNZM/DNZM)\n3.Companion (CNZM)\n4.Officer (ONZM)\n5.Member (MNZM)", options: [{ value: "1", label: "1", url: "https://www.medals.pl/bc/r/nz2nzom.gif" }, { value: "1a", label: "1a", url: "https://www.medals.pl/bc/r/nz2nzom.gif" }, { value: "2", label: "2", url: "https://www.medals.pl/bc/r/nz2nzom.gif" }, { value: "2a", label: "2a", url: "https://www.medals.pl/bc/r/nz2nzom.gif" }, { value: "3", label: "3", url: "https://www.medals.pl/bc/r/nz2nzom.gif" }, { value: "4", label: "4", url: "https://www.medals.pl/bc/r/nz2nzom.gif" }, { value: "5", label: "5", url: "https://www.medals.pl/bc/r/nz2nzom.gif" }] },
  ],
  "https://www.medals.pl/bc/r/uk1cafb.gif": [
    { type: 'select', name: "uk1cafb", label: 'Select variant', tooltip: "uk1cafb", options: [{ value: "1", label: "Award", url: "https://www.medals.pl/bc/r/uk1cafb.gif" }, { value: "2", label: "1 Bar", url: "https://www.medals.pl/bc/r/uk1cafb1.gif" }, { value: "3", label: "2 Bars", url: "https://www.medals.pl/bc/r/uk1cafb2.gif" }] },
  ],
  "https://www.medals.pl/bc/r/uk1cdfb.gif": [
    { type: 'select', name: "uk1cdfb", label: 'Select variant', tooltip: "uk1cdfb", options: [{ value: "1", label: "Award", url: "https://www.medals.pl/bc/r/uk1cdfb.gif" }, { value: "2", label: "1 Bar", url: "https://www.medals.pl/bc/r/uk1cdfb1.gif" }, { value: "3", label: "2 Bars", url: "https://www.medals.pl/bc/r/uk1cdfb2.gif" }] },
  ],
  "https://www.medals.pl/bc/r/uk1cds.gif": [
    { type: 'select', name: "uk1cds", label: 'Select variant', tooltip: "uk1cds", options: [{ value: "1", label: "Award", url: "https://www.medals.pl/bc/r/uk1cds.gif" }, { value: "2", label: "1 Bar", url: "https://www.medals.pl/bc/r/uk1cds1.gif" }, { value: "3", label: "2 Bars", url: "https://www.medals.pl/bc/r/uk1cds2.gif" }] },
  ],
  "https://www.medals.pl/bc/r/uk1cgc.gif": [
    { type: 'select', name: "uk1cgc", label: 'Select variant', tooltip: "uk1cgc", options: [{ value: "1", label: "Award", url: "https://www.medals.pl/bc/r/uk1cgc.gif" }, { value: "2", label: "1 Bar", url: "https://www.medals.pl/bc/r/uk1cgc1.gif" }, { value: "3", label: "2 Bars", url: "https://www.medals.pl/bc/r/uk1cgc2.gif" }] },
  ],
  "https://www.medals.pl/bc/r/uk1cmm.gif": [
    { type: 'select', name: "uk1cmm", label: 'Select variant', tooltip: "uk1cmm", options: [{ value: "1", label: "Award", url: "https://www.medals.pl/bc/r/uk1cmm.gif" }, { value: "2", label: "1 Bar", url: "https://www.medals.pl/bc/r/uk1cmm1.gif" }, { value: "3", label: "2 Bars", url: "https://www.medals.pl/bc/r/uk1cmm2.gif" }] },
  ],
  "https://www.medals.pl/bc/r/uk1crrc.gif": [
    { type: 'select', name: "uk1crrc", label: 'Select variant', tooltip: "1.Royal Red Cross (RRC)\n2.Associate Royal Red Cross (ARRC)", options: [{ value: "1", label: "1", url: "https://www.medals.pl/bc/r/uk1crrc.gif" }, { value: "2", label: "2", url: "https://www.medals.pl/bc/r/uk1crrc.gif" }] },
  ],
  "https://www.medals.pl/bc/r/uk1macb.gif": [
    { type: 'select', name: "uk1macb", label: 'Select variant', tooltip: "uk1macb", options: [{ value: "1", label: "Award", url: "https://www.medals.pl/bc/r/uk1macb.gif" }, { value: "2", label: "1 Clasp", url: "https://www.medals.pl/bc/r/uk1macb1.gif" }, { value: "3", label: "2 Clasps", url: "https://www.medals.pl/bc/r/uk1macb2.gif" }, { value: "4", label: "3 Clasps", url: "https://www.medals.pl/bc/r/uk1macb3.gif" }, { value: "5", label: "4 Clasps", url: "https://www.medals.pl/bc/r/uk1macb4.gif" }, { value: "6", label: "5 Clasps", url: "https://www.medals.pl/bc/r/uk1macb5.gif" }, { value: "7", label: "6 Clasps", url: "https://www.medals.pl/bc/r/uk1macb6.gif" }] },
  ],
  "https://www.medals.pl/bc/r/uk1mas.gif": [
    { type: 'select', name: "uk1mas", label: 'Select variant', tooltip: "uk1mas", options: [{ value: "1", label: "Award", url: "https://www.medals.pl/bc/r/uk1mas.gif" }, { value: "2", label: "1 Clasp", url: "https://www.medals.pl/bc/r/uk1mas1.gif" }, { value: "3", label: "2 Clasps", url: "https://www.medals.pl/bc/r/uk1mas2.gif" }, { value: "4", label: "3 Clasps", url: "https://www.medals.pl/bc/r/uk1mas3.gif" }] },
  ],
  "https://www.medals.pl/bc/r/uk1mbecg.gif": [
    { type: 'checkbox', name: "gallantry_emblem_(1957-74)", label: "gallantry emblem (1957-74)", variantUrl: "https://www.medals.pl/bc/r/uk1mbecg.gif", affectsImage: true },
  ],
  "https://www.medals.pl/bc/r/uk1mcs_m.gif": [
    { type: 'select', name: "uk1mcs", label: 'Decoration', options: [{ value: "1", label: "Plain", url: "https://www.medals.pl/bc/r/uk1mcs.gif" }, { value: "2", label: "MID", url: "https://www.medals.pl/bc/r/uk1mcs_m.gif" }, { value: "3", label: "QCB", url: "https://www.medals.pl/bc/r/uk1mcs_cb.gif" }, { value: "4", label: "QCBA", url: "https://www.medals.pl/bc/r/uk1mcs_cba.gif" }, { value: "5", label: "QCVS", url: "https://www.medals.pl/bc/r/uk1mcs_cvs.gif" }] },
  ],
  "https://www.medals.pl/bc/r/uk1mge.gif": [
    { type: 'checkbox', name: "w_bar", label: "w. bar", variantUrl: "https://www.medals.pl/bc/r/uk1mge1.gif", affectsImage: true },
  ],
  "https://www.medals.pl/bc/r/uk1mgu.gif": [
    { type: 'checkbox', name: "w_rosette", label: "w. rosette", variantUrl: "https://www.medals.pl/bc/r/uk1mgu1.gif", affectsImage: true },
    { type: 'checkbox', name: "MID", label: "MID", variantUrl: "https://www.medals.pl/bc/r/uk1mgu_m.gif", affectsImage: true },
  ],
  "https://www.medals.pl/bc/r/uk1mhac.gif": [
    { type: 'select', name: "uk1mhac", label: 'Select variant', tooltip: "uk1mhac", options: [{ value: "1", label: "Award", url: "https://www.medals.pl/bc/r/uk1mhac.gif" }, { value: "2", label: "1 Clasp", url: "https://www.medals.pl/bc/r/uk1mhac1.gif" }, { value: "3", label: "2 Clasps", url: "https://www.medals.pl/bc/r/uk1mhac2.gif" }, { value: "4", label: "3 Clasps", url: "https://www.medals.pl/bc/r/uk1mhac3.gif" }] },
  ],
  "https://www.medals.pl/bc/r/uk1mhsni.gif": [
    { type: 'select', name: "uk1mhsni", label: 'Select variant', tooltip: "uk1mhsni", options: [{ value: "1", label: "Award", url: "https://www.medals.pl/bc/r/uk1mhsni.gif" }, { value: "2", label: "1 Clasp", url: "https://www.medals.pl/bc/r/uk1mhsni1.gif" }, { value: "3", label: "2 Clasps", url: "https://www.medals.pl/bc/r/uk1mhsni2.gif" }, { value: "4", label: "3 Clasps", url: "https://www.medals.pl/bc/r/uk1mhsni3.gif" }] },
  ],
  "https://www.medals.pl/bc/r/uk1mko_m.gif": [
    { type: 'checkbox', name: "MID", label: "MID", variantUrl: "https://www.medals.pl/bc/r/uk1mko_m.gif", affectsImage: true },
  ],
  "https://www.medals.pl/bc/r/uk1mlsa.gif": [
    { type: 'checkbox', name: "w_bar", label: "w. bar", variantUrl: "https://www.medals.pl/bc/r/uk1mlsa1.gif", affectsImage: true },
  ],
  "https://www.medals.pl/bc/r/uk1mlsaf.gif": [
    { type: 'checkbox', name: "w_bar", label: "w. bar", variantUrl: "https://www.medals.pl/bc/r/uk1mlsaf1.gif", affectsImage: true },
  ],
  "https://www.medals.pl/bc/r/uk1mlsn.gif": [
    { type: 'checkbox', name: "w_bar", label: "w. bar", variantUrl: "https://www.medals.pl/bc/r/uk1mlsn1.gif", affectsImage: true },
  ],
  "https://www.medals.pl/bc/r/uk1mos_m2.gif": [
    { type: 'select', name: "uk1mos", label: 'Decoration', options: [{ value: "1", label: "MID", url: "https://www.medals.pl/bc/r/uk1mos_m2.gif" }, { value: "2", label: "MID + Rosette", url: "https://www.medals.pl/bc/r/uk1mos1_m2.gif" }, { value: "3", label: "Plain", url: "https://www.medals.pl/bc/r/uk1mos.gif" }, { value: "4", label: "Plain + Rosette", url: "https://www.medals.pl/bc/r/uk1mos1.gif" }, { value: "5", label: "QCB", url: "https://www.medals.pl/bc/r/uk1mos_cb.gif" }, { value: "6", label: "QCBA", url: "https://www.medals.pl/bc/r/uk1mos_cba.gif" }, { value: "7", label: "QCVS", url: "https://www.medals.pl/bc/r/uk1mos_cvs.gif" }] },
  ],
  "https://www.medals.pl/bc/r/uk1mosaf_m2.gif": [
    { type: 'select', name: "uk1mosaf", label: 'Decoration', options: [{ value: "1", label: "MID", url: "https://www.medals.pl/bc/r/uk1mosaf_m2.gif" }, { value: "2", label: "MID + Rosette", url: "https://www.medals.pl/bc/r/uk1mosaf1_m2.gif" }, { value: "3", label: "Plain", url: "https://www.medals.pl/bc/r/uk1mosaf.gif" }, { value: "4", label: "Plain + Rosette", url: "https://www.medals.pl/bc/r/uk1mosaf1.gif" }, { value: "5", label: "QCB", url: "https://www.medals.pl/bc/r/uk1mosaf_cb.gif" }, { value: "6", label: "QCBA", url: "https://www.medals.pl/bc/r/uk1mosaf_cba.gif" }, { value: "7", label: "QCVS", url: "https://www.medals.pl/bc/r/uk1mosaf_cvs.gif" }] },
  ],
  "https://www.medals.pl/bc/r/uk1mosco_m2.gif": [
    { type: 'select', name: "uk1mosco", label: 'Decoration', options: [{ value: "1", label: "MID", url: "https://www.medals.pl/bc/r/uk1mosco_m2.gif" }, { value: "2", label: "MID + Rosette", url: "https://www.medals.pl/bc/r/uk1mosco1_m2.gif" }, { value: "3", label: "Plain", url: "https://www.medals.pl/bc/r/uk1mosco.gif" }, { value: "4", label: "Plain + Rosette", url: "https://www.medals.pl/bc/r/uk1mosco1.gif" }, { value: "5", label: "QCB", url: "https://www.medals.pl/bc/r/uk1mosco_cb.gif" }, { value: "6", label: "QCBA", url: "https://www.medals.pl/bc/r/uk1mosco_cba.gif" }, { value: "7", label: "QCVS", url: "https://www.medals.pl/bc/r/uk1mosco_cvs.gif" }] },
  ],
  "https://www.medals.pl/bc/r/uk1mqg.gif": [
    { type: 'checkbox', name: "w_bar", label: "w. bar", variantUrl: "https://www.medals.pl/bc/r/uk1mqg1.gif", affectsImage: true },
  ],
  "https://www.medals.pl/bc/r/uk1msa1.gif": [
    { type: 'select', name: "uk1msa_variant", label: 'Variant', options: [{ value: "1", label: "With Rosette (no MID)", url: "https://www.medals.pl/bc/r/uk1msa.gif" }, { value: "2", label: "With MID emblem", url: "https://www.medals.pl/bc/r/uk1msa1.gif" }, { value: "3", label: "With Rosette + MID", url: "https://www.medals.pl/bc/r/uk1msa_m.gif" }] },
  ],
  "https://www.medals.pl/bc/r/uk1mvns_m.gif": [
    { type: 'checkbox', name: "MID", label: "MID", variantUrl: "https://www.medals.pl/bc/r/uk1mvns_m.gif", affectsImage: true },
  ],
  "https://www.medals.pl/bc/r/uk1mvrs.gif": [
    { type: 'select', name: "uk1mvrs", label: 'Select variant', tooltip: "uk1mvrs", options: [{ value: "1", label: "Award", url: "https://www.medals.pl/bc/r/uk1mvrs.gif" }, { value: "2", label: "1 Clasp", url: "https://www.medals.pl/bc/r/uk1mvrs1.gif" }, { value: "3", label: "2 Clasps", url: "https://www.medals.pl/bc/r/uk1mvrs2.gif" }, { value: "4", label: "3 Clasps", url: "https://www.medals.pl/bc/r/uk1mvrs3.gif" }] },
  ],
  "https://www.medals.pl/bc/r/uk1obecb.gif": [
    { type: 'select', name: "uk1obecb", label: 'Select variant', tooltip: "1.Knight/Dame Grand Cross (GBE)\n2.Knight/Dame Commander (KBE/DBE)\n3.Commander (CBE)\n4.Officer (OBE)\n5.Member (MBE)", options: [{ value: "1", label: "1", url: "https://www.medals.pl/bc/r/uk1obecb.gif" }, { value: "2", label: "2", url: "https://www.medals.pl/bc/r/uk1obecb.gif" }, { value: "3", label: "3", url: "https://www.medals.pl/bc/r/uk1obecb.gif" }, { value: "4", label: "4", url: "https://www.medals.pl/bc/r/uk1obecb.gif" }, { value: "5", label: "5", url: "https://www.medals.pl/bc/r/uk1obecb.gif" }] },
  ],
  "https://www.medals.pl/bc/r/uk1obemb.gif": [
    { type: 'select', name: "uk1obemb", label: 'Select variant', tooltip: "1.Knight/Dame Grand Cross (GBE)\n2.Knight/Dame Commander (KBE/DBE)\n3.Commander (CBE)\n4.Officer (OBE)\n5.Member (MBE)", options: [{ value: "1", label: "1", url: "https://www.medals.pl/bc/r/uk1obemb.gif" }, { value: "2", label: "2", url: "https://www.medals.pl/bc/r/uk1obemb.gif" }, { value: "3", label: "3", url: "https://www.medals.pl/bc/r/uk1obemb.gif" }, { value: "4", label: "4", url: "https://www.medals.pl/bc/r/uk1obemb.gif" }, { value: "5", label: "5", url: "https://www.medals.pl/bc/r/uk1obemb.gif" }] },
  ],
  "https://www.medals.pl/bc/r/uk1ods.gif": [
    { type: 'select', name: "uk1ods", label: 'Select variant', tooltip: "uk1ods", options: [{ value: "1", label: "Award", url: "https://www.medals.pl/bc/r/uk1ods.gif" }, { value: "2", label: "1 Bar", url: "https://www.medals.pl/bc/r/uk1ods1.gif" }, { value: "3", label: "2 Bars", url: "https://www.medals.pl/bc/r/uk1ods2.gif" }, { value: "4", label: "3 Bars", url: "https://www.medals.pl/bc/r/uk1ods3.gif" }] },
  ],
  "https://www.medals.pl/bc/r/uk1miqc_m2.gif": [
    { type: 'select', name: "uk1miqc", label: 'Decoration', options: [{ value: "1", label: "MID", url: "https://www.medals.pl/bc/r/uk1miqc_m2.gif" }, { value: "2", label: "MID + Rosette", url: "https://www.medals.pl/bc/r/uk1miqc1_m2.gif" }, { value: "3", label: "Plain", url: "https://www.medals.pl/bc/r/uk1miqc.gif" }, { value: "4", label: "Plain + Rosette", url: "https://www.medals.pl/bc/r/uk1miqc1.gif" }, { value: "5", label: "QCB", url: "https://www.medals.pl/bc/r/uk1miqc_cb.gif" }, { value: "6", label: "QCBA", url: "https://www.medals.pl/bc/r/uk1miqc_cba.gif" }, { value: "7", label: "QCVS", url: "https://www.medals.pl/bc/r/uk1miqc_cvs.gif" }] },
  ],
  "https://www.medals.pl/bc/r/uk1vc.gif": [
    { type: 'checkbox', name: "w_bar", label: "w. bar", variantUrl: "https://www.medals.pl/bc/r/uk1vc2.gif", affectsImage: true },
  ],
  // ── NATO medals ──────────────────────────────────────────────
  "https://www.medals.pl/bc/r/nato.gif": [
    { type: 'select', name: "nato", label: 'Decoration', options: [{ value: "1", label: "Plain", url: "https://www.medals.pl/bc/r/nato.gif" }, { value: "2", label: "MID", url: "https://www.medals.pl/bc/r/nato_m2.gif" }, { value: "3", label: "QCB", url: "https://www.medals.pl/bc/r/nato_cb.gif" }, { value: "4", label: "QCBA", url: "https://www.medals.pl/bc/r/nato_cba.gif" }, { value: "5", label: "QCVS", url: "https://www.medals.pl/bc/r/nato_cvs.gif" }] },
  ],
  "https://www.medals.pl/bc/r/natok.gif": [
    { type: 'select', name: "natok", label: 'Decoration', options: [{ value: "1", label: "Plain", url: "https://www.medals.pl/bc/r/natok.gif" }, { value: "2", label: "MID", url: "https://www.medals.pl/bc/r/natok_m2.gif" }, { value: "3", label: "QCB", url: "https://www.medals.pl/bc/r/natok_cb.gif" }, { value: "4", label: "QCBA", url: "https://www.medals.pl/bc/r/natok_cba.gif" }, { value: "5", label: "QCVS", url: "https://www.medals.pl/bc/r/natok_cvs.gif" }] },
  ],
  "https://www.medals.pl/bc/r/natom.gif": [
    { type: 'select', name: "natom", label: 'Decoration', options: [{ value: "1", label: "Plain", url: "https://www.medals.pl/bc/r/natom.gif" }, { value: "2", label: "MID", url: "https://www.medals.pl/bc/r/natom_m2.gif" }, { value: "3", label: "QCB", url: "https://www.medals.pl/bc/r/natom_cb.gif" }, { value: "4", label: "QCBA", url: "https://www.medals.pl/bc/r/natom_cba.gif" }, { value: "5", label: "QCVS", url: "https://www.medals.pl/bc/r/natom_cvs.gif" }] },
  ],
  "https://www.medals.pl/int/r/natob.gif": [
    { type: 'select', name: "natob", label: 'Decoration', options: [{ value: "1", label: "Plain", url: "https://www.medals.pl/int/r/natob.gif" }, { value: "2", label: "MID", url: "https://www.medals.pl/bc/r/natob_m2.gif" }, { value: "3", label: "QCB", url: "https://www.medals.pl/bc/r/natob_cb.gif" }, { value: "4", label: "QCBA", url: "https://www.medals.pl/bc/r/natob_cba.gif" }, { value: "5", label: "QCVS", url: "https://www.medals.pl/bc/r/natob_cvs.gif" }] },
  ],
  "https://www.medals.pl/bc/r/natoa5.gif": [
    { type: 'select', name: "natoa5", label: 'Decoration', options: [{ value: "1", label: "Plain", url: "https://www.medals.pl/bc/r/natoa5.gif" }, { value: "2", label: "MID", url: "https://www.medals.pl/bc/r/natoa5_m2.gif" }, { value: "3", label: "QCB", url: "https://www.medals.pl/bc/r/natoa5_cb.gif" }, { value: "4", label: "QCBA", url: "https://www.medals.pl/bc/r/natoa5_cba.gif" }, { value: "5", label: "QCVS", url: "https://www.medals.pl/bc/r/natoa5_cvs.gif" }] },
  ],
  "https://www.medals.pl/bc/r/natoisaf.gif": [
    { type: 'select', name: "natoisaf", label: 'Decoration', options: [{ value: "1", label: "Plain", url: "https://www.medals.pl/bc/r/natoisaf.gif" }, { value: "2", label: "MID", url: "https://www.medals.pl/bc/r/natoisaf_m2.gif" }, { value: "3", label: "QCB", url: "https://www.medals.pl/bc/r/natoisaf_cb.gif" }, { value: "4", label: "QCBA", url: "https://www.medals.pl/bc/r/natoisaf_cba.gif" }, { value: "5", label: "QCVS", url: "https://www.medals.pl/bc/r/natoisaf_cvs.gif" }] },
  ],

  // ── BELGIUM ──────────────────────────────────────────────────────────────────
  "https://www.medals.pl/be/r/be1ole4.gif": [
    { type: 'select', name: "be1ole", label: 'Class', options: [{ value: "1", label: "1st (Grand Cross)", url: "https://www.medals.pl/be/r/be1ole4.gif" }, { value: "2", label: "2nd (Grand Officer)", url: "https://www.medals.pl/be/r/be1ole4.gif" }, { value: "3", label: "3rd (Commander)", url: "https://www.medals.pl/be/r/be1ole4.gif" }, { value: "4", label: "4th (Officer)", url: "https://www.medals.pl/be/r/be1ole4.gif" }, { value: "5", label: "5th (Member)", url: "https://www.medals.pl/be/r/be1ole4.gif" }] },
  ],
  "https://www.medals.pl/be/r/be1oleii.gif": [
    { type: 'select', name: "be1oleii", label: 'Class', options: [{ value: "1", label: "1st (Grand Cross)", url: "https://www.medals.pl/be/r/be1oleii.gif" }, { value: "2", label: "2nd (Grand Officer)", url: "https://www.medals.pl/be/r/be1oleii1.gif" }, { value: "3", label: "3rd (Commander)", url: "https://www.medals.pl/be/r/be1oleii2.gif" }, { value: "4", label: "4th (Officer)", url: "https://www.medals.pl/be/r/be1oleii3.gif" }, { value: "5", label: "5th (Member)", url: "https://www.medals.pl/be/r/be1oleii4.gif" }] },
  ],

  // ── FRANCE ───────────────────────────────────────────────────────────────────
  "https://www.medals.pl/fr/r/fr2olh4.gif": [
    { type: 'select', name: "fr2olh", label: 'Class', options: [{ value: "1", label: "Grand Croix", url: "https://www.medals.pl/fr/r/fr2olh4.gif" }, { value: "2", label: "Grand Officier", url: "https://www.medals.pl/fr/r/fr2olh4.gif" }, { value: "3", label: "Commandeur", url: "https://www.medals.pl/fr/r/fr2olh4.gif" }, { value: "4", label: "Officier", url: "https://www.medals.pl/fr/r/fr2olh4.gif" }, { value: "5", label: "Chevalier", url: "https://www.medals.pl/fr/r/fr2olh4.gif" }] },
  ],

  // ── ITALY ────────────────────────────────────────────────────────────────────
  "https://www.medals.pl/it/r/it1omi.gif": [
    { type: 'select', name: "it1omi", label: 'Class', options: [{ value: "1", label: "1st (Grand Cross)", url: "https://www.medals.pl/it/r/it1omi.gif" }, { value: "2", label: "2nd (Grand Officer)", url: "https://www.medals.pl/it/r/it1omi1.gif" }, { value: "3", label: "3rd (Commander)", url: "https://www.medals.pl/it/r/it1omi2.gif" }, { value: "4", label: "4th (Officer)", url: "https://www.medals.pl/it/r/it1omi3.gif" }, { value: "5", label: "5th (Member)", url: "https://www.medals.pl/it/r/it1omi4.gif" }] },
  ],
  "https://www.medals.pl/it/r/it1oml.gif": [
    { type: 'select', name: "it1oml", label: 'Class', options: [{ value: "1", label: "1st (Grand Cross)", url: "https://www.medals.pl/it/r/it1oml.gif" }, { value: "2", label: "2nd (Grand Officer)", url: "https://www.medals.pl/it/r/it1oml1.gif" }, { value: "3", label: "3rd (Commander)", url: "https://www.medals.pl/it/r/it1oml2.gif" }, { value: "4", label: "4th (Officer)", url: "https://www.medals.pl/it/r/it1oml3.gif" }, { value: "5", label: "5th (Member)", url: "https://www.medals.pl/it/r/it1oml4.gif" }] },
  ],
  "https://www.medals.pl/it/r/it1ocr.gif": [
    { type: 'select', name: "it1ocr", label: 'Class', options: [{ value: "1", label: "1st (Grand Cross)", url: "https://www.medals.pl/it/r/it1ocr.gif" }, { value: "2", label: "2nd (Grand Officer)", url: "https://www.medals.pl/it/r/it1ocr1.gif" }, { value: "3", label: "3rd (Commander)", url: "https://www.medals.pl/it/r/it1ocr2.gif" }, { value: "4", label: "4th (Officer)", url: "https://www.medals.pl/it/r/it1ocr3.gif" }, { value: "5", label: "5th (Member)", url: "https://www.medals.pl/it/r/it1ocr4.gif" }] },
  ],
  "https://www.medals.pl/it/r/it2ome.gif": [
    { type: 'select', name: "it2ome", label: 'Class', options: [{ value: "1", label: "1st (Grand Cross)", url: "https://www.medals.pl/it/r/it2ome.gif" }, { value: "2", label: "2nd (Grand Officer)", url: "https://www.medals.pl/it/r/it2ome1.gif" }, { value: "3", label: "3rd (Commander)", url: "https://www.medals.pl/it/r/it2ome2.gif" }, { value: "4", label: "4th (Officer)", url: "https://www.medals.pl/it/r/it2ome3.gif" }, { value: "5", label: "5th (Member)", url: "https://www.medals.pl/it/r/it2ome4.gif" }] },
  ],
  "https://www.medals.pl/it/r/it2mvmi2.gif": [
    { type: 'select', name: "it2mvmi", label: 'Grade', options: [{ value: "1", label: "Gold", url: "https://www.medals.pl/it/r/it2mvmi2.gif" }, { value: "2", label: "Silver", url: "https://www.medals.pl/it/r/it2mvmi2.gif" }] },
  ],

  // ── GREECE ───────────────────────────────────────────────────────────────────
  "https://www.medals.pl/gr/r/gr1ore.gif": [
    { type: 'select', name: "gr1ore", label: 'Class', options: [{ value: "1", label: "1st (Grand Cross)", url: "https://www.medals.pl/gr/r/gr1ore.gif" }, { value: "2", label: "2nd (Grand Commander)", url: "https://www.medals.pl/gr/r/gr1ore1.gif" }, { value: "3", label: "3rd (Commander)", url: "https://www.medals.pl/gr/r/gr1ore2.gif" }, { value: "4", label: "4th (Officer)", url: "https://www.medals.pl/gr/r/gr1ore3.gif" }, { value: "5", label: "5th (Member)", url: "https://www.medals.pl/gr/r/gr1ore4.gif" }] },
  ],
  "https://www.medals.pl/gr/r/gr1oph.gif": [
    { type: 'select', name: "gr1oph", label: 'Class', options: [{ value: "1", label: "1st (Grand Cross)", url: "https://www.medals.pl/gr/r/gr1oph.gif" }, { value: "2", label: "2nd (Grand Commander)", url: "https://www.medals.pl/gr/r/gr1oph1.gif" }, { value: "3", label: "3rd (Commander)", url: "https://www.medals.pl/gr/r/gr1oph2.gif" }, { value: "4", label: "4th (Officer)", url: "https://www.medals.pl/gr/r/gr1oph3.gif" }, { value: "5", label: "5th (Member)", url: "https://www.medals.pl/gr/r/gr1oph4.gif" }] },
  ],
  "https://www.medals.pl/gr/r/gr1oge.gif": [
    { type: 'select', name: "gr1oge", label: 'Class', options: [{ value: "1", label: "1st (Grand Cross)", url: "https://www.medals.pl/gr/r/gr1oge.gif" }, { value: "2", label: "2nd (Grand Commander)", url: "https://www.medals.pl/gr/r/gr1oge1.gif" }, { value: "3", label: "3rd (Commander)", url: "https://www.medals.pl/gr/r/gr1oge2.gif" }, { value: "4", label: "4th (Officer)", url: "https://www.medals.pl/gr/r/gr1oge3.gif" }, { value: "5", label: "5th (Member)", url: "https://www.medals.pl/gr/r/gr1oge4.gif" }] },
  ],

  // ── NORWAY ───────────────────────────────────────────────────────────────────
  "https://www.medals.pl/no/r/no1ool.gif": [
    { type: 'select', name: "no1ool", label: 'Class', options: [{ value: "1", label: "1st (Grand Cross)", url: "https://www.medals.pl/no/r/no1ool.gif" }, { value: "2", label: "2nd (Grand Officer)", url: "https://www.medals.pl/no/r/no1ool1.gif" }, { value: "3", label: "3rd (Commander)", url: "https://www.medals.pl/no/r/no1ool2.gif" }, { value: "4", label: "4th (Knight, 1st Class)", url: "https://www.medals.pl/no/r/no1ool3.gif" }, { value: "5", label: "5th (Knight)", url: "https://www.medals.pl/no/r/no1ool4.gif" }] },
  ],

  // ── NETHERLANDS ──────────────────────────────────────────────────────────────
  "https://www.medals.pl/nl/r/nl1oon.gif": [
    { type: 'select', name: "nl1oon", label: 'Class', options: [{ value: "1", label: "1st (Grand Cross)", url: "https://www.medals.pl/nl/r/nl1oon.gif" }, { value: "2", label: "2nd (Grand Officer)", url: "https://www.medals.pl/nl/r/nl1oon1.gif" }, { value: "3", label: "3rd (Commander)", url: "https://www.medals.pl/nl/r/nl1oon2.gif" }, { value: "4", label: "4th (Officer)", url: "https://www.medals.pl/nl/r/nl1oon3.gif" }, { value: "5", label: "5th (Member)", url: "https://www.medals.pl/nl/r/nl1oon4.gif" }] },
  ],

  // ── POLAND ───────────────────────────────────────────────────────────────────
  "https://www.medals.pl/pl/r/pl4opr.gif": [
    { type: 'select', name: "pl4opr", label: 'Class', options: [{ value: "1", label: "1st (Grand Cross)", url: "https://www.medals.pl/pl/r/pl4opr.gif" }, { value: "2", label: "2nd (Grand Officer)", url: "https://www.medals.pl/pl/r/pl4opr1.gif" }, { value: "3", label: "3rd (Commander)", url: "https://www.medals.pl/pl/r/pl4opr2.gif" }, { value: "4", label: "4th (Officer)", url: "https://www.medals.pl/pl/r/pl4opr3.gif" }, { value: "5", label: "5th (Member)", url: "https://www.medals.pl/pl/r/pl4opr4.gif" }] },
  ],
  "https://www.medals.pl/pl/r/pl2cvab.gif": [
    { type: 'select', name: "pl2cvab", label: 'Grade', options: [{ value: "1", label: "Gold", url: "https://www.medals.pl/pl/r/pl2cvab.gif" }, { value: "2", label: "Silver", url: "https://www.medals.pl/pl/r/pl2cvab1.gif" }, { value: "3", label: "Bronze", url: "https://www.medals.pl/pl/r/pl2cvab2.gif" }] },
  ],

  // ── LUXEMBOURG ───────────────────────────────────────────────────────────────
  "https://www.medals.pl/lu/r/lu1oan.gif": [
    { type: 'select', name: "lu1oan", label: 'Class', options: [{ value: "1", label: "1st (Grand Cross)", url: "https://www.medals.pl/lu/r/lu1oan.gif" }, { value: "2", label: "2nd (Grand Officer)", url: "https://www.medals.pl/lu/r/lu1oan1.gif" }, { value: "3", label: "3rd (Commander)", url: "https://www.medals.pl/lu/r/lu1oan2.gif" }, { value: "4", label: "4th (Officer)", url: "https://www.medals.pl/lu/r/lu1oan3.gif" }, { value: "5", label: "5th (Member)", url: "https://www.medals.pl/lu/r/lu1oan4.gif" }] },
  ],

};