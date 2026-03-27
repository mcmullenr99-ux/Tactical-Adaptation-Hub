// ─── RIBBON LIBRARY ─────────────────────────────────────────────────────────
// Sources:
//   - EZRackBuilder / USAMM — 1118 real US awards, all branches + auxiliaries
//   - medals.org.uk — 1274 international awards across 31 countries + UN
// Total: 215 ribbons. Auto-generated. DO NOT hand-edit.

export interface RibbonTemplate {
  country: string;
  branch: string;
  name: string;
  url: string;
  sku?: string;
}

export const RIBBON_COUNTRIES: string[] = ['United States', 'NATO', 'United Nations', 'United Kingdom', 'Australia', 'Canada', 'New Zealand', 'Belgium', 'France', 'Italy', 'Greece', 'Norway', 'Netherlands', 'Russia', 'Germany (NVA)', 'Poland', 'Luxembourg', 'Switzerland', 'Croatia', 'Finland', 'Estonia', 'Austria', 'Czech Republic', 'Sweden', 'Slovakia', 'Georgia', 'Iran', 'North Korea', 'Pakistan', 'Belgium', 'Italy', 'Norway', 'Switzerland', 'Luxembourg', 'Lithuania', 'Latvia', 'China'];

export const RIBBON_BRANCHES_BY_COUNTRY: Record<string, string[]> = {
  'United States': ['US Gallantry', 'US Orders & Distinguished Service', 'US Commendations', 'US Campaign Medals', 'US Service Medals', 'US Long Service', 'US Commemorative'],
  'United Nations': ['United Nations'],
  'NATO': ['NATO'],
  'United Kingdom': ['UK Gallantry', 'UK Orders', 'UK Commendations', 'UK Campaign Medals', 'UK Service Medals', 'UK Jubilee Medals'],
  'Australia': ['Australia Gallantry', 'Australia Orders', 'Australia Commendations', 'Australia Campaign Medals', 'Australia Service Medals', 'Australia Jubilee & Commemorative'],
  'Canada': ['Canada Gallantry', 'Canada Orders', 'Canada Campaign Medals', 'Canada Service Medals', 'Canada Jubilee & Commemorative'],
  'New Zealand': ['New Zealand Gallantry', 'New Zealand Orders', 'New Zealand Campaign Medals', 'New Zealand Service Medals', 'New Zealand Jubilee & Commemorative'],
  'Belgium': ['Belgium Orders & Distinguished Service', 'Belgium Gallantry', 'Belgium Service Medals', 'Belgium Long Service', 'Belgium Campaign Medals'],
  'France': ['France Gallantry', 'France Orders & Distinguished Service', 'France Service Medals', 'France Campaign Medals'],
  'Italy': ['Italy Orders', 'Italy Gallantry & Crosses'],
  'Greece': ['Greece Orders', 'Greece Gallantry & Crosses'],
  'Norway': ['Norway Orders', 'Norway Gallantry', 'Norway Service Medals', 'Norway Long Service', 'Norway Campaign Medals', 'Norway Commemorative'],
  'Netherlands': ['Netherlands Orders', 'Netherlands Gallantry & Crosses'],
  'Russia': ['Russia Gallantry', 'Russia Orders & Distinguished Service', 'Russia Commendations'],
  'Germany (NVA)': ['Germany (NVA) Orders & Distinguished Service', 'Germany (NVA) Long Service', 'Germany (NVA) Commemorative'],
  'Poland': ['Poland Orders', 'Poland Gallantry & Crosses', 'Poland Service Medals', 'Poland Campaign Medals', 'Poland Commemorative'],
  'Luxembourg': ['Luxembourg Orders', 'Luxembourg Gallantry & Crosses'],
  'Switzerland': ['Switzerland Gallantry', 'Switzerland Service Medals', 'Switzerland Long Service', 'Switzerland Campaign Medals'],
  'Croatia': ['Croatia Gallantry', 'Croatia Orders & Distinguished Service', 'Croatia Service Medals', 'Croatia Campaign Medals'],
  'Finland': ['Finland Gallantry', 'Finland Commendations', 'Finland Long Service'],
  'Estonia': ['Estonia Gallantry', 'Estonia Commendations', 'Estonia Long Service', 'Estonia Commemorative'],
  'Austria': ['Austria Gallantry', 'Austria Commendations', 'Austria Service Medals', 'Austria Campaign Medals', 'Austria Long Service'],
  'Czech Republic': ['Czech Republic Gallantry', 'Czech Republic Orders & Distinguished Service', 'Czech Republic Service Medals', 'Czech Republic Campaign Medals'],
  'Sweden': ['Sweden Orders', 'Sweden Military Medals', 'Sweden Long Service'],
  'Slovakia': ['Slovakia Orders', 'Slovakia Gallantry', 'Slovakia Service Medals', 'Slovakia Commemorative'],
  'Georgia': ['Georgia Orders', 'Georgia Service Medals'],
  'Iran': ['Iran Orders', 'Iran Gallantry', 'Iran Service Medals'],
  'North Korea': ['North Korea Orders', 'North Korea Service Medals', 'North Korea Commemorative'],
  'Pakistan': ['Pakistan Gallantry', 'Pakistan Orders & Distinguished Service', 'Pakistan Service Medals', 'Pakistan Long Service'],
  'Belgium': ['Belgium Orders', 'Belgium Gallantry', 'Belgium Service Medals'],
  'Italy': ['Italy Orders', 'Italy Gallantry', 'Italy Service Medals'],
  'Norway': ['Norway Gallantry', 'Norway Orders', 'Norway Service Medals', 'Norway Long Service', 'Norway Commemorative'],
  'Switzerland': ['Switzerland Service Medals', 'Switzerland Long Service', 'Switzerland Campaign Medals'],
  'Luxembourg': ['Luxembourg Orders', 'Luxembourg Service Medals'],
  'Lithuania': ['Lithuania Orders', 'Lithuania Service Medals', 'Lithuania Commemorative'],
  'Latvia': ['Latvia Orders', 'Latvia Gallantry'],
  'China': ['China Gallantry', 'China Service Medals', 'China Campaign Medals', 'China Long Service'],
};

export const RIBBON_TEMPLATES: RibbonTemplate[] = [  // ─── INTERNATIONAL ───
  // ─── NATO ───
  // ─── UNITED NATIONS ───



  // === UNITED NATIONS ===
  { country: 'United Nations', branch: 'United Nations', name: 'UNTSO Medal', url: 'https://www.medals.org.uk/united-nations/images/united-nations032.gif' },
  { country: 'United Nations', branch: 'United Nations', name: 'UNMOGIP Medal', url: 'https://www.medals.org.uk/united-nations/images/united-nations034.gif' },
  { country: 'United Nations', branch: 'United Nations', name: 'UNFICYP Medal (Cyprus)', url: 'https://www.medals.pl/int/r/unfic.gif' },
  { country: 'United Nations', branch: 'United Nations', name: 'UNDOF Medal', url: 'https://www.medals.org.uk/united-nations/images/united-nations047.gif' },
  { country: 'United Nations', branch: 'United Nations', name: 'UNIFIL Medal', url: 'https://www.medals.org.uk/united-nations/images/united-nations018.gif' },
  { country: 'United Nations', branch: 'United Nations', name: 'UNIIMOG Medal', url: 'https://www.medals.org.uk/united-nations/images/united-nations052.gif' },
  { country: 'United Nations', branch: 'United Nations', name: 'UNTAG Medal (Namibia)', url: 'https://www.medals.pl/int/r/untag.gif' },
  { country: 'United Nations', branch: 'United Nations', name: 'ONUCA Medal', url: 'https://www.medals.org.uk/united-nations/images/united-nations057.gif' },
  { country: 'United Nations', branch: 'United Nations', name: 'UNIKOM Medal (Iraq/Kuwait)', url: 'https://www.medals.pl/int/r/unikom.gif' },
  { country: 'United Nations', branch: 'United Nations', name: 'UNAVEM Medal (Angola)', url: 'https://www.medals.pl/int/r/unavem.gif' },
  { country: 'United Nations', branch: 'United Nations', name: 'MINURSO Medal (Western Sahara)', url: 'https://www.medals.pl/int/r/minurso.gif' },
  { country: 'United Nations', branch: 'United Nations', name: 'ONUSAL Medal', url: 'https://www.medals.org.uk/united-nations/images/united-nations062.gif' },
  { country: 'United Nations', branch: 'United Nations', name: 'UNPROFOR Medal (Bosnia)', url: 'https://www.medals.pl/int/r/unprofor.gif' },
  { country: 'United Nations', branch: 'United Nations', name: 'UNAMIC Medal (Cambodia)', url: 'https://www.medals.pl/int/r/unamic.gif' },
  { country: 'United Nations', branch: 'United Nations', name: 'UNTAC Medal (Cambodia)', url: 'https://www.medals.pl/int/r/untac.gif' },
  { country: 'United Nations', branch: 'United Nations', name: 'UNOSOM Medal', url: 'https://www.medals.org.uk/united-nations/images/united-nations070.gif' },
  { country: 'United Nations', branch: 'United Nations', name: 'ONUMOZ Medal (Mozambique)', url: 'https://www.medals.pl/int/r/onumoz.gif' },
  { country: 'United Nations', branch: 'United Nations', name: 'UNAMIR Medal (Rwanda)', url: 'https://www.medals.pl/int/r/unamir.gif' },
  { country: 'United Nations', branch: 'United Nations', name: 'UNMIH Medal (Haiti)', url: 'https://www.medals.pl/int/r/unmih.gif' },
  { country: 'United Nations', branch: 'United Nations', name: 'UNOMIG Medal (Georgia)', url: 'https://www.medals.pl/int/r/unomig.gif' },
  { country: 'United Nations', branch: 'United Nations', name: 'UNOMIL Medal', url: 'https://www.medals.org.uk/united-nations/images/united-nations078.gif' },
  { country: 'United Nations', branch: 'United Nations', name: 'UNOMUR Medal', url: 'https://www.medals.org.uk/united-nations/images/united-nations079.gif' },
  { country: 'United Nations', branch: 'United Nations', name: 'UNMOT Medal', url: 'https://www.medals.org.uk/united-nations/images/united-nations024.gif' },
  { country: 'United Nations', branch: 'United Nations', name: 'UNMIBH Medal (Bosnia)', url: 'https://www.medals.pl/int/r/unmibh.gif' },
  { country: 'United Nations', branch: 'United Nations', name: 'UNMOP Medal', url: 'https://www.medals.org.uk/united-nations/images/united-nations083.gif' },
  { country: 'United Nations', branch: 'United Nations', name: 'UNTAES Medal (E. Slavonia)', url: 'https://www.medals.pl/int/r/untaes.gif' },
  { country: 'United Nations', branch: 'United Nations', name: 'MINUGUA Medal', url: 'https://www.medals.org.uk/united-nations/images/united-nations006.gif' },
  { country: 'United Nations', branch: 'United Nations', name: 'MINURCA Medal', url: 'https://www.medals.org.uk/united-nations/images/united-nations087.gif' },
  { country: 'United Nations', branch: 'United Nations', name: 'UNPSG Medal', url: 'https://www.medals.org.uk/united-nations/images/united-nations089.gif' },
  { country: 'United Nations', branch: 'United Nations', name: 'UNOMSIL Medal (Sierra Leone)', url: 'https://www.medals.pl/int/r/unomsil.gif' },
  { country: 'United Nations', branch: 'United Nations', name: 'UNMIK Medal (Kosovo)', url: 'https://www.medals.pl/int/r/unmik.gif' },
  { country: 'United Nations', branch: 'United Nations', name: 'UNAMET Medal (East Timor)', url: 'https://www.medals.pl/int/r/unamet.gif' },
  { country: 'United Nations', branch: 'United Nations', name: 'UNPREDEP Medal', url: 'https://www.medals.org.uk/united-nations/images/united-nations097.gif' },
  { country: 'United Nations', branch: 'United Nations', name: 'MONUC Medal (Congo)', url: 'https://www.medals.pl/int/r/monuc.gif' },
  { country: 'United Nations', branch: 'United Nations', name: 'UNMEE Medal', url: 'https://www.medals.org.uk/united-nations/images/united-nations104.gif' },
  { country: 'United Nations', branch: 'United Nations', name: 'UNSSM Medal (Special Service)', url: 'https://www.medals.pl/int/r/unssm.gif' },
  { country: 'United Nations', branch: 'United Nations', name: 'UNHQ Medal (HQ Service)', url: 'https://www.medals.pl/int/r/unhq.gif' },
  { country: 'United Nations', branch: 'United Nations', name: 'UNMIL Medal (Liberia)', url: 'https://www.medals.pl/int/r/unmil.gif' },
  { country: 'United Nations', branch: 'United Nations', name: 'UNMIS Medal (Sudan)', url: 'https://www.medals.pl/int/r/unmis.gif' },
  { country: 'International', branch: 'United Nations', name: 'United Nations Medal', url: 'https://www.uniformribbons.com/image/un_medal_ribbon.png' },
  { country: 'International', branch: 'United Nations', name: 'United Nations Special Service Medal', url: 'https://www.uniformribbons.com/image/un_special_service_medal_ribbon.png' },


  // === NATO ===
  { country: 'NATO', branch: 'NATO', name: 'NATO Medal Meritorious', url: 'https://www.uniformribbons.com/image/nato_medal_meritorious_ribbon.png' },
  { country: 'NATO', branch: 'NATO', name: 'NATO Medal (Bosnia)', url: 'https://www.uniformribbons.com/image/nato_bosnia_ribbon.png' },
  { country: 'NATO', branch: 'NATO', name: 'NATO Medal (Kosovo)', url: 'https://www.uniformribbons.com/image/nato_kosovo_ribbon.png' },
  { country: 'NATO', branch: 'NATO', name: 'NATO Medal (Non-Article 5)', url: 'https://www.uniformribbons.com/image/nato_medal_non_article_5_ribbon.png' },
  { country: 'NATO', branch: 'NATO', name: 'NATO Medal (ISAF - Afghanistan)', url: 'https://www.uniformribbons.com/image/nato_isaf_ribbon.png' },
  { country: 'International', branch: 'NATO', name: 'Multinational Force and Observers Medal', url: 'https://www.uniformribbons.com/image/mfo_medal_ribbon.png' },
  { country: 'International', branch: 'NATO', name: 'Inter-American Defense Board Medal', url: 'https://www.uniformribbons.com/image/iadb_medal_ribbon.png' },

  // ── United Kingdom ──────────────────────────────────────────────
  { country: 'United Kingdom', branch: 'UK Gallantry', name: 'Victoria Cross (VC)', url: 'https://www.medals.pl/bc/r/uk1vc.gif' },
  { country: 'United Kingdom', branch: 'UK Gallantry', name: 'Conspicuous Gallantry Cross (CGC)', url: 'https://www.medals.pl/bc/r/uk1cgc.gif' },
  { country: 'United Kingdom', branch: 'UK Commendations', name: 'King\'s/Queen\'s Commendation for Bravery (KCB/QCB)', url: 'https://www.medals.pl/bc/r/uk1bqcb.gif' },
  { country: 'United Kingdom', branch: 'UK Commendations', name: 'King\'s/Queen\'s Commendation for Bravery in the Air', url: 'https://www.medals.pl/bc/r/uk1bqcba.gif' },
  { country: 'United Kingdom', branch: 'UK Commendations', name: 'King\'s/Queen\'s Commendation for Valuable Service', url: 'https://www.medals.pl/bc/r/uk1bqcvs.gif' },
  { country: 'United Kingdom', branch: 'UK Commendations', name: 'Mention in Despatches (MID)', url: 'https://www.medals.pl/bc/r/uk1bmid2.gif' },
  { country: 'United Kingdom', branch: 'UK Campaign Medals', name: 'South Atlantic Medal 1982 (Falklands)', url: 'https://www.medals.pl/bc/r/uk1msa1.gif' },
  { country: 'United Kingdom', branch: 'UK Campaign Medals', name: 'Gulf Medal 1991', url: 'https://www.medals.pl/bc/r/uk1mgu.gif' },
  { country: 'United Kingdom', branch: 'UK Campaign Medals', name: 'International Force East Timor Medal (INTERFET)', url: 'https://www.medals.pl/bc/r/interfet.gif' },
  { country: 'United Kingdom', branch: 'UK Campaign Medals', name: 'Operational Service Medal - Sierra Leone', url: 'https://www.medals.pl/bc/r/uk1mos_m2.gif' },
  { country: 'United Kingdom', branch: 'UK Campaign Medals', name: 'Operational Service Medal - Afghanistan', url: 'https://www.medals.pl/bc/r/uk1mosaf_m2.gif' },
  { country: 'United Kingdom', branch: 'UK Campaign Medals', name: 'Iraq Campaign Medal 2003 (Op Telic)', url: 'https://www.medals.pl/bc/r/uk1miqc_m2.gif' },
  { country: 'United Kingdom', branch: 'UK Campaign Medals', name: 'Operational Service Medal - Congo', url: 'https://www.medals.pl/bc/r/uk1mosco_m2.gif' },
  { country: 'United Kingdom', branch: 'UK Campaign Medals', name: 'Iraq Reconstruction Service Medal', url: 'https://www.medals.pl/bc/r/uk1mirs.gif' },
  { country: 'United Kingdom', branch: 'UK Campaign Medals', name: 'Civilian Service Medal - Afghanistan', url: 'https://www.medals.pl/bc/r/uk1mcsaf.gif' },
  { country: 'United Kingdom', branch: 'UK Campaign Medals', name: 'Accumulated Campaign Service Medal (1994-2011)', url: 'https://www.medals.pl/bc/r/uk1mas.gif' },
  { country: 'United Kingdom', branch: 'UK Campaign Medals', name: 'Accumulated Campaign Service Medal (2011)', url: 'https://www.medals.pl/bc/r/uk1macb.gif' },
  { country: 'United Kingdom', branch: 'UK Service Medals', name: 'King\'s/Queen\'s Volunteer Reserves Medal (KVRM/QVRM)', url: 'https://www.medals.pl/bc/r/uk1mqvr.gif' },
  { country: 'United Kingdom', branch: 'UK Service Medals', name: 'Volunteer Reserves Service Medal (VRSM)', url: 'https://www.medals.pl/bc/r/uk1mvrs.gif' },
  { country: 'United Kingdom', branch: 'UK Service Medals', name: 'Volunteer Reserves Service Medal - HAC', url: 'https://www.medals.pl/bc/r/uk1mhac.gif' },
  { country: 'United Kingdom', branch: 'UK Service Medals', name: 'Northern Ireland Home Service Medal', url: 'https://www.medals.pl/bc/r/uk1mhsni.gif' },
  { country: 'United Kingdom', branch: 'UK Service Medals', name: 'Royal Fleet Auxiliary Service Medal', url: 'https://www.medals.pl/bc/r/uk1mrfa.gif' },
  { country: 'United Kingdom', branch: 'UK Jubilee Medals', name: 'Golden Jubilee Medal 2002', url: 'https://www.medals.pl/bc/r/uk1mju2002.gif' },
  { country: 'United Kingdom', branch: 'UK Jubilee Medals', name: 'Diamond Jubilee Medal 2012', url: 'https://www.medals.pl/bc/r/uk1mju2012.gif' },

  // ── Australia ────────────────────────────────────────────────────
  { country: 'Australia', branch: 'Australia Gallantry', name: 'Star of Gallantry (SG)', url: 'https://www.medals.pl/bc/r/au2sga.gif' },
  { country: 'Australia', branch: 'Australia Gallantry', name: 'Medal for Gallantry (MG)', url: 'https://www.medals.pl/bc/r/au2mga.gif' },
  { country: 'Australia', branch: 'Australia Commendations', name: 'Commendation for Gallantry', url: 'https://www.medals.pl/bc/r/au2coga.gif' },
  { country: 'Australia', branch: 'Australia Commendations', name: 'Commendation for Distinguished Service', url: 'https://www.medals.pl/bc/r/au2cods.gif' },
  { country: 'Australia', branch: 'Australia Service Medals', name: 'Distinguished Service Cross (DSC)', url: 'https://www.medals.pl/bc/r/au2cds.gif' },
  { country: 'Australia', branch: 'Australia Service Medals', name: 'Conspicuous Service Cross (CSC)', url: 'https://www.medals.pl/bc/r/au2ccs.gif' },
  { country: 'Australia', branch: 'Australia Service Medals', name: 'Distinguished Service Medal (DSM)', url: 'https://www.medals.pl/bc/r/au2mds.gif' },
  { country: 'Australia', branch: 'Australia Service Medals', name: 'Conspicuous Service Medal (CSM)', url: 'https://www.medals.pl/bc/r/au2mcs.gif' },
  { country: 'Australia', branch: 'Australia Service Medals', name: 'Australian Defence Force Long Service Medal', url: 'https://www.medals.pl/bc/r/au2mlsd.gif' },
  { country: 'Australia', branch: 'Australia Service Medals', name: 'Reserve Force Decoration (RFD)', url: 'https://www.medals.pl/bc/r/au2drf.gif' },
  { country: 'Australia', branch: 'Australia Service Medals', name: 'Reserve Force Medal', url: 'https://www.medals.pl/bc/r/au2mrf.gif' },
  { country: 'Australia', branch: 'Australia Service Medals', name: 'Australian Defence Medal', url: 'https://www.medals.pl/bc/r/au2mad.gif' },
  { country: 'Australia', branch: 'Australia Campaign Medals', name: 'Afghanistan Medal', url: 'https://www.medals.pl/bc/r/au2maf.gif' },
  { country: 'Australia', branch: 'Australia Campaign Medals', name: 'Iraq Medal', url: 'https://www.medals.pl/bc/r/au2miq.gif' },
  { country: 'Australia', branch: 'Australia Campaign Medals', name: 'International Force East Timor Medal (INTERFET)', url: 'https://www.medals.pl/bc/r/interfet.gif' },
  { country: 'Australia', branch: 'Australia Jubilee & Commemorative', name: 'Golden Jubilee Medal 2002', url: 'https://www.medals.pl/bc/r/uk1mju2002.gif' },
  { country: 'Australia', branch: 'Australia Jubilee & Commemorative', name: 'Diamond Jubilee Medal 2012', url: 'https://www.medals.pl/bc/r/uk1mju2012.gif' },
  { country: 'Australia', branch: 'Australia Jubilee & Commemorative', name: 'Australian Centenary Medal 2000', url: 'https://www.medals.pl/bc/r/au2mce.gif' },
  { country: 'Australia', branch: 'Australia Service Medals', name: 'Unit Citation for Gallantry', url: 'https://www.medals.pl/bc/r/au2ucga1.gif' },
  { country: 'Australia', branch: 'Australia Service Medals', name: 'Meritorious Unit Citation', url: 'https://www.medals.pl/bc/r/au2ucms1.gif' },

  // ── Canada ───────────────────────────────────────────────────────
  { country: 'Canada', branch: 'Canada Gallantry', name: 'Star of Military Valour (SMV)', url: 'https://www.medals.pl/bc/r/ca2smv.gif' },
  { country: 'Canada', branch: 'Canada Gallantry', name: 'Medal of Military Valour (MMV)', url: 'https://www.medals.pl/bc/r/ca2mmv.gif' },
  { country: 'Canada', branch: 'Canada Service Medals', name: 'Meritorious Service Cross - Military (MSC)', url: 'https://www.medals.pl/bc/r/ca2cmsm.gif' },
  { country: 'Canada', branch: 'Canada Service Medals', name: 'Meritorious Service Medal - Military (MSM)', url: 'https://www.medals.pl/bc/r/ca2mmsm.gif' },
  { country: 'Canada', branch: 'Canada Campaign Medals', name: 'Gulf and Kuwait Medal', url: 'https://www.medals.pl/bc/r/ca2mgk1.gif' },
  { country: 'Canada', branch: 'Canada Campaign Medals', name: 'Somalia Medal', url: 'https://www.medals.pl/bc/r/ca2mso.gif' },
  { country: 'Canada', branch: 'Canada Campaign Medals', name: 'South West Asia Service Medal (SWASM)', url: 'https://www.medals.pl/bc/r/ca2mswass.gif' },
  { country: 'Canada', branch: 'Canada Campaign Medals', name: 'General Campaign Star - Afghanistan', url: 'https://www.medals.pl/bc/r/ca2sgcaf.gif' },
  { country: 'Canada', branch: 'Canada Campaign Medals', name: 'General Campaign Star - SW Asia', url: 'https://www.medals.pl/bc/r/ca2sgcswa.gif' },
  { country: 'Canada', branch: 'Canada Campaign Medals', name: 'Operational Service Medal - Expedition', url: 'https://www.medals.pl/bc/r/ca2mosexp.gif' },
  { country: 'Canada', branch: 'Canada Campaign Medals', name: 'Operational Service Medal - SW Asia', url: 'https://www.medals.pl/bc/r/ca2mosswa.gif' },
  { country: 'Canada', branch: 'Canada Campaign Medals', name: 'Special Service Medal (SSM)', url: 'https://www.medals.pl/bc/r/ca2mss.gif' },
  { country: 'Canada', branch: 'Canada Campaign Medals', name: 'Canadian Peacekeeping Service Medal (CPSM)', url: 'https://www.medals.pl/bc/r/ca2mpe.gif' },
  { country: 'Canada', branch: 'Canada Campaign Medals', name: 'International Force East Timor Medal (INTERFET)', url: 'https://www.medals.pl/bc/r/interfet.gif' },
  { country: 'Canada', branch: 'Canada Jubilee & Commemorative', name: '125th Anniversary of Confederation Medal 1992', url: 'https://www.medals.pl/bc/r/ca2m125.gif' },
  { country: 'Canada', branch: 'Canada Jubilee & Commemorative', name: 'Golden Jubilee Medal 2002', url: 'https://www.medals.pl/bc/r/uk1mju2002.gif' },
  { country: 'Canada', branch: 'Canada Jubilee & Commemorative', name: 'Diamond Jubilee Medal 2012', url: 'https://www.medals.pl/bc/r/uk1mju2012.gif' },

  // ── New Zealand ──────────────────────────────────────────────────
  { country: 'New Zealand', branch: 'New Zealand Gallantry', name: 'New Zealand Cross (NZC)', url: 'https://www.medals.pl/bc/r/nz2nzc.gif' },
  { country: 'New Zealand', branch: 'New Zealand Gallantry', name: 'NZ Gallantry Star (NZGS)', url: 'https://www.medals.pl/bc/r/nz2nzgs.gif' },
  { country: 'New Zealand', branch: 'New Zealand Gallantry', name: 'NZ Bravery Star (NZBS)', url: 'https://www.medals.pl/bc/r/nz2nzbs.gif' },
  { country: 'New Zealand', branch: 'New Zealand Gallantry', name: 'NZ Gallantry Decoration (NZGD)', url: 'https://www.medals.pl/bc/r/nz2nzgd.gif' },
  { country: 'New Zealand', branch: 'New Zealand Gallantry', name: 'NZ Bravery Decoration (NZBD)', url: 'https://www.medals.pl/bc/r/nz2nzbd.gif' },
  { country: 'New Zealand', branch: 'New Zealand Gallantry', name: 'NZ Gallantry Medal (NZGM)', url: 'https://www.medals.pl/bc/r/nz2nzgm.gif' },
  { country: 'New Zealand', branch: 'New Zealand Gallantry', name: 'NZ Bravery Medal (NZBM)', url: 'https://www.medals.pl/bc/r/nz2nzbm.gif' },
  { country: 'New Zealand', branch: 'New Zealand Orders', name: 'Order of New Zealand (ONZ)', url: 'https://www.medals.pl/bc/r/nz2onz.gif' },
  { country: 'New Zealand', branch: 'New Zealand Orders', name: 'New Zealand Order of Merit', url: 'https://www.medals.pl/bc/r/nz2nzom.gif' },
  { country: 'New Zealand', branch: 'New Zealand Service Medals', name: 'Distinguished Service Decoration (DSD)', url: 'https://www.medals.pl/bc/r/nz2dsd.gif' },
  { country: 'New Zealand', branch: 'New Zealand Service Medals', name: 'NZ Meritorious Service Medal', url: 'https://www.medals.pl/bc/r/nz2mms.gif' },
  { country: 'New Zealand', branch: 'New Zealand Service Medals', name: 'NZ Armed Forces Award', url: 'https://www.medals.pl/bc/r/nz2aarf.gif' },
  { country: 'New Zealand', branch: 'New Zealand Campaign Medals', name: 'Operational Service Medal (NZ)', url: 'https://www.medals.pl/bc/r/nz2mos.gif' },
  { country: 'New Zealand', branch: 'New Zealand Campaign Medals', name: 'General Service Medal - Afghanistan', url: 'https://www.medals.pl/bc/r/nz2mgsaf.gif' },
  { country: 'New Zealand', branch: 'New Zealand Campaign Medals', name: 'GSM - Afghanistan (secondary area)', url: 'https://www.medals.pl/bc/r/nz2mgsafb.gif' },
  { country: 'New Zealand', branch: 'New Zealand Campaign Medals', name: 'General Service Medal - Iraq 2003', url: 'https://www.medals.pl/bc/r/nz2mgsiq.gif' },
  { country: 'New Zealand', branch: 'New Zealand Campaign Medals', name: 'NZ East Timor Medal', url: 'https://www.medals.pl/bc/r/nz2met.gif' },
  { country: 'New Zealand', branch: 'New Zealand Campaign Medals', name: 'General Service Medal - Solomon Islands', url: 'https://www.medals.pl/bc/r/nz2mgssi.gif' },
  { country: 'New Zealand', branch: 'New Zealand Campaign Medals', name: 'General Service Medal - Timor Leste', url: 'https://www.medals.pl/bc/r/nz2mgstl.gif' },
  { country: 'New Zealand', branch: 'New Zealand Campaign Medals', name: 'NZ General Service Medal (Warlike)', url: 'https://www.medals.pl/bc/r/nz2mgsw.gif' },
  { country: 'New Zealand', branch: 'New Zealand Campaign Medals', name: 'NZ General Service Medal (Non-Warlike)', url: 'https://www.medals.pl/bc/r/nz2mgsp.gif' },
  { country: 'New Zealand', branch: 'New Zealand Campaign Medals', name: 'International Force East Timor Medal (INTERFET)', url: 'https://www.medals.pl/bc/r/interfet.gif' },
  { country: 'New Zealand', branch: 'New Zealand Service Medals', name: 'NZ Army LS & GC Medal', url: 'https://www.medals.pl/bc/r/uk1mlsa.gif' },
  { country: 'New Zealand', branch: 'New Zealand Service Medals', name: 'NZ Navy LS & GC Medal', url: 'https://www.medals.pl/bc/r/uk1mlsn.gif' },
  { country: 'New Zealand', branch: 'New Zealand Service Medals', name: 'NZ Air Force LS & GC Medal', url: 'https://www.medals.pl/bc/r/uk1mlsaf.gif' },
  { country: 'New Zealand', branch: 'New Zealand Jubilee & Commemorative', name: 'Golden Jubilee Medal 2002', url: 'https://www.medals.pl/bc/r/uk1mju2002.gif' },
  { country: 'New Zealand', branch: 'New Zealand Jubilee & Commemorative', name: 'Diamond Jubilee Medal 2012', url: 'https://www.medals.pl/bc/r/uk1mju2012.gif' },
  { country: 'New Zealand', branch: 'New Zealand Campaign Medals', name: 'Special Service Medal - Asian Tsunami', url: 'https://www.medals.pl/bc/r/nz2mssat.gif' },
  { country: 'United Kingdom', branch: 'UK Gallantry', name: 'George Cross (GC)', url: 'https://www.medals.pl/bc/r/uk1gc.gif' },
  { country: 'United Kingdom', branch: 'UK Gallantry', name: 'Distinguished Service Order (DSO)', url: 'https://www.medals.pl/bc/r/uk1ods.gif' },
  { country: 'United Kingdom', branch: 'UK Gallantry', name: 'Military Cross (MC)', url: 'https://www.medals.pl/bc/r/uk1cmm.gif' },
  { country: 'United Kingdom', branch: 'UK Gallantry', name: 'Distinguished Service Cross (DSC)', url: 'https://www.medals.pl/bc/r/uk1cds.gif' },
  { country: 'United Kingdom', branch: 'UK Gallantry', name: 'Distinguished Flying Cross (DFC)', url: 'https://www.medals.pl/bc/r/uk1cdfb.gif' },
  { country: 'United Kingdom', branch: 'UK Gallantry', name: 'Air Force Cross (AFC)', url: 'https://www.medals.pl/bc/r/uk1cafb.gif' },
  { country: 'United Kingdom', branch: 'UK Gallantry', name: 'George Medal (GM)', url: 'https://www.medals.pl/bc/r/uk1mge.gif' },
  { country: 'United Kingdom', branch: 'UK Gallantry', name: 'Queen/King Gallantry Medal (QGM/KGM)', url: 'https://www.medals.pl/bc/r/uk1mqg.gif' },
  { country: 'United Kingdom', branch: 'UK Gallantry', name: 'Royal Red Cross (RRC)', url: 'https://www.medals.pl/bc/r/uk1crrc.gif' },
  { country: 'United Kingdom', branch: 'UK Orders', name: 'Order of the British Empire - Military (OBE)', url: 'https://www.medals.pl/bc/r/uk1obemb.gif' },
  { country: 'United Kingdom', branch: 'UK Service Medals', name: 'British Empire Medal - Military (BEM)', url: 'https://www.medals.pl/bc/r/uk1mbemb.gif' },
  { country: 'United Kingdom', branch: 'UK Service Medals', name: 'Meritorious Service Medal (MSM)', url: 'https://www.medals.pl/bc/r/uk1mmsa.gif' },
  { country: 'United Kingdom', branch: 'UK Campaign Medals', name: 'Campaign Service Medal 1962-2007', url: 'https://www.medals.pl/bc/r/uk1mcs_m.gif' },
  { country: 'United Kingdom', branch: 'UK Campaign Medals', name: 'Polar Medal', url: 'https://www.medals.pl/bc/r/uk1mpo.gif' },
  { country: 'Australia', branch: 'Australia Gallantry', name: 'Star of Courage (SC)', url: 'https://www.medals.pl/bc/r/au2sco1.gif' },
  { country: 'Australia', branch: 'Australia Gallantry', name: 'Bravery Medal (BM)', url: 'https://www.medals.pl/bc/r/au2mbr1.gif' },
  { country: 'Australia', branch: 'Australia Commendations', name: 'Commendation for Brave Conduct', url: 'https://www.medals.pl/bc/r/au2cobc.gif' },
  { country: 'Australia', branch: 'Australia Orders', name: 'Medal of the Order of Australia - Military Division (OAM)', url: 'https://www.medals.pl/bc/r/au2moam.gif' },
  { country: 'Australia', branch: 'Australia Service Medals', name: 'Australian Antarctic Medal (AAM)', url: 'https://www.medals.pl/bc/r/au2maa.gif' },
  { country: 'Australia', branch: 'Australia Service Medals', name: 'Defence Force Service Medal (DFSM)', url: 'https://www.medals.pl/bc/r/au2mdfs.gif' },
  { country: 'Australia', branch: 'Australia Service Medals', name: 'Australian Service Medal (ASM)', url: 'https://www.medals.pl/bc/r/au2mas.gif' },
  { country: 'Canada', branch: 'Canada Gallantry', name: 'Cross of Valour (CV)', url: 'https://www.medals.pl/bc/r/ca2cva.gif' },
  { country: 'Canada', branch: 'Canada Gallantry', name: 'Star of Courage (SC)', url: 'https://www.medals.pl/bc/r/ca2sco.gif' },
  { country: 'Canada', branch: 'Canada Gallantry', name: 'Medal of Bravery (MB)', url: 'https://www.medals.pl/bc/r/ca2mbr.gif' },
  { country: 'Canada', branch: 'Canada Orders', name: 'Order of Military Merit (OMM)', url: 'https://www.medals.pl/bc/r/ca2omm1.gif' },
  { country: 'Canada', branch: 'Canada Service Medals', name: 'Sacrifice Medal', url: 'https://www.medals.pl/bc/r/ca2msa.gif' },
  { country: 'Canada', branch: 'Canada Service Medals', name: 'Canadian Forces Decoration (CD)', url: 'https://www.medals.pl/bc/r/ca2dcf.gif' },
  { country: 'Canada', branch: 'Canada Campaign Medals', name: 'General Campaign Star - Expedition', url: 'https://www.medals.pl/bc/r/ca2sgcexp.gif' },
  { country: 'Canada', branch: 'Canada Campaign Medals', name: 'General Service Medal - Afghanistan', url: 'https://www.medals.pl/bc/r/ca2mgsaf.gif' },
  { country: 'Canada', branch: 'Canada Campaign Medals', name: 'General Service Medal - South West Asia', url: 'https://www.medals.pl/bc/r/ca2mgsswa.gif' },
  { country: 'Canada', branch: 'Canada Campaign Medals', name: 'General Service Medal - Expedition', url: 'https://www.medals.pl/bc/r/ca2mgsexp.gif' },
  { country: 'Canada', branch: 'Canada Campaign Medals', name: 'Operational Service Medal - South Sudan', url: 'https://www.medals.pl/bc/r/ca2moss.gif' },
  { country: 'Canada', branch: 'Canada Campaign Medals', name: 'Operational Service Medal - Expedition', url: 'https://www.medals.pl/bc/r/ca2mosexp.gif' },
  { country: 'New Zealand', branch: 'New Zealand Service Medals', name: 'New Zealand Antarctic Medal (NZAM)', url: 'https://www.medals.pl/bc/r/nz2manz.gif' },
  { country: 'United Kingdom', branch: 'UK Service Medals', name: 'Army Long Service & Good Conduct Medal', url: 'https://www.medals.pl/bc/r/uk1mlsa.gif' },
  { country: 'United Kingdom', branch: 'UK Service Medals', name: 'Naval Long Service & Good Conduct Medal', url: 'https://www.medals.pl/bc/r/uk1mlsn.gif' },
  { country: 'United Kingdom', branch: 'UK Service Medals', name: 'RAF Long Service & Good Conduct Medal', url: 'https://www.medals.pl/bc/r/uk1mlsaf.gif' },
  // ─── BELGIUM ────────────────────────────────────────────────────────────────
  // Orders & Distinguished Service - Order of Leopold (all 5 grades, military division)
  { country: 'Belgium', branch: 'Belgium Orders & Distinguished Service', name: 'Order of Leopold - Knight', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/BEL_-_Order_of_Leopold_-_Knight_bar.svg/250px-BEL_-_Order_of_Leopold_-_Knight_bar.svg.png' },
  { country: 'Belgium', branch: 'Belgium Orders & Distinguished Service', name: 'Order of Leopold - Officer', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/BEL_-_Order_of_Leopold_-_Officer_bar.svg/250px-BEL_-_Order_of_Leopold_-_Officer_bar.svg.png' },
  { country: 'Belgium', branch: 'Belgium Orders & Distinguished Service', name: 'Order of Leopold - Commander', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/BEL_-_Order_of_Leopold_-_Commander_bar.svg/250px-BEL_-_Order_of_Leopold_-_Commander_bar.svg.png' },
  { country: 'Belgium', branch: 'Belgium Orders & Distinguished Service', name: 'Order of Leopold - Grand Officer', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/BEL_-_Order_of_Leopold_-_Grand_Officer_bar.svg/250px-BEL_-_Order_of_Leopold_-_Grand_Officer_bar.svg.png' },
  { country: 'Belgium', branch: 'Belgium Orders & Distinguished Service', name: 'Order of Leopold - Grand Cordon', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/BEL_-_Order_of_Leopold_-_Grand_Cordon_bar.svg/250px-BEL_-_Order_of_Leopold_-_Grand_Cordon_bar.svg.png' },
  // Order of Leopold II (all 5 grades + 3 medals)
  { country: 'Belgium', branch: 'Belgium Orders & Distinguished Service', name: 'Order of Leopold II - Knight', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/BEL_Order_of_Leopold_II_-_Knight_BAR.svg/250px-BEL_Order_of_Leopold_II_-_Knight_BAR.svg.png' },
  { country: 'Belgium', branch: 'Belgium Orders & Distinguished Service', name: 'Order of Leopold II - Officer', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/BEL_Order_of_Leopold_II_-_Officer_BAR.svg/250px-BEL_Order_of_Leopold_II_-_Officer_BAR.svg.png' },
  { country: 'Belgium', branch: 'Belgium Orders & Distinguished Service', name: 'Order of Leopold II - Commander', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/BEL_Order_of_Leopold_II_-_Commander_BAR.svg/250px-BEL_Order_of_Leopold_II_-_Commander_BAR.svg.png' },
  { country: 'Belgium', branch: 'Belgium Orders & Distinguished Service', name: 'Order of Leopold II - Grand Officer', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/BEL_Order_of_Leopold_II_-_Grand_Officer_BAR.svg/250px-BEL_Order_of_Leopold_II_-_Grand_Officer_BAR.svg.png' },
  { country: 'Belgium', branch: 'Belgium Orders & Distinguished Service', name: 'Order of Leopold II - Grand Cross', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/BEL_Order_of_Leopold_II_-_Grand_Cross_BAR.svg/250px-BEL_Order_of_Leopold_II_-_Grand_Cross_BAR.svg.png' },
  { country: 'Belgium', branch: 'Belgium Orders & Distinguished Service', name: 'Order of Leopold II - Gold Medal', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/BEL_Order_of_Leopold_II_-_Gold_Medal_BAR.png/250px-BEL_Order_of_Leopold_II_-_Gold_Medal_BAR.png' },
  { country: 'Belgium', branch: 'Belgium Orders & Distinguished Service', name: 'Order of Leopold II - Silver Medal', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/BEL_Order_of_Leopold_II_-_Silver_Medal_BAR.png/250px-BEL_Order_of_Leopold_II_-_Silver_Medal_BAR.png' },
  { country: 'Belgium', branch: 'Belgium Orders & Distinguished Service', name: 'Order of Leopold II - Bronze Medal', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/BEL_Order_of_Leopold_II_-_Bronze_Medal_BAR.png/250px-BEL_Order_of_Leopold_II_-_Bronze_Medal_BAR.png' },
  // Order of the Crown (Kroonorde) - all 5 grades + 3 medals
  { country: 'Belgium', branch: 'Belgium Orders & Distinguished Service', name: 'Order of the Crown - Knight', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/BEL_Kroonorde_Ridder_BAR.svg/250px-BEL_Kroonorde_Ridder_BAR.svg.png' },
  { country: 'Belgium', branch: 'Belgium Orders & Distinguished Service', name: 'Order of the Crown - Officer', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/BEL_Kroonorde_Officier_BAR.svg/250px-BEL_Kroonorde_Officier_BAR.svg.png' },
  { country: 'Belgium', branch: 'Belgium Orders & Distinguished Service', name: 'Order of the Crown - Commander', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/BEL_Kroonorde_Commandeur_BAR.svg/250px-BEL_Kroonorde_Commandeur_BAR.svg.png' },
  { country: 'Belgium', branch: 'Belgium Orders & Distinguished Service', name: 'Order of the Crown - Grand Officer', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/BEL_Kroonorde_Grootofficier_BAR.svg/250px-BEL_Kroonorde_Grootofficier_BAR.svg.png' },
  { country: 'Belgium', branch: 'Belgium Orders & Distinguished Service', name: 'Order of the Crown - Grand Cross', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/BEL_Kroonorde_Grootkruis_BAR.svg/250px-BEL_Kroonorde_Grootkruis_BAR.svg.png' },
  { country: 'Belgium', branch: 'Belgium Orders & Distinguished Service', name: 'Order of the Crown - Gold Medal', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/BEL_Kroonorde_Med_Goud_BAR.svg/250px-BEL_Kroonorde_Med_Goud_BAR.svg.png' },
  { country: 'Belgium', branch: 'Belgium Orders & Distinguished Service', name: 'Order of the Crown - Silver Medal', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/BEL_Kroonorde_Med_Zilver_BAR.svg/250px-BEL_Kroonorde_Med_Zilver_BAR.svg.png' },
  { country: 'Belgium', branch: 'Belgium Orders & Distinguished Service', name: 'Order of the Crown - Bronze Medal', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/BEL_Kroonorde_Med_Brons_BAR.svg/250px-BEL_Kroonorde_Med_Brons_BAR.svg.png' },
  // Gallantry
  { country: 'Belgium', branch: 'Belgium Gallantry', name: 'Military Cross - 1st Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/BEL_Militair_Kruis_1klasse_BAR.svg/250px-BEL_Militair_Kruis_1klasse_BAR.svg.png' },
  { country: 'Belgium', branch: 'Belgium Gallantry', name: 'Military Cross - 2nd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/BEL_Militair_Kruis_2klasse_BAR.svg/250px-BEL_Militair_Kruis_2klasse_BAR.svg.png' },
  { country: 'Belgium', branch: 'Belgium Gallantry', name: 'Military Decoration for Gallantry', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/BEL_Military_Decoration_for_Gallantry.PNG/250px-BEL_Military_Decoration_for_Gallantry.PNG' },
  { country: 'Belgium', branch: 'Belgium Gallantry', name: 'Croix de Guerre (1954 - modern)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/BEL_Croix_de_Guerre_1954_ribbon.svg/250px-BEL_Croix_de_Guerre_1954_ribbon.svg.png' },
  // Service Medals
  { country: 'Belgium', branch: 'Belgium Service Medals', name: 'Military Decoration for Faithful Service', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/BEL_Military_Decoration_for_Faithful_Service.PNG/250px-BEL_Military_Decoration_for_Faithful_Service.PNG' },
  // Campaign Medals / Foreign Service
  { country: 'Belgium', branch: 'Belgium Campaign Medals', name: 'Foreign Service Honour Cross - 1st Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/BEL_Foreign_Service_Honour_Cross_1st_Class_ribbon.PNG/250px-BEL_Foreign_Service_Honour_Cross_1st_Class_ribbon.PNG' },
  { country: 'Belgium', branch: 'Belgium Campaign Medals', name: 'Foreign Service Honour Cross - 2nd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/BEL_Foreign_Service_Honour_Cross_2nd_Class_ribbon.PNG/250px-BEL_Foreign_Service_Honour_Cross_2nd_Class_ribbon.PNG' },
  { country: 'Belgium', branch: 'Belgium Campaign Medals', name: 'Foreign Service Honour Cross - 3rd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/BEL_Foreign_Service_Honour_Cross_3rd_Class_ribbon.PNG/250px-BEL_Foreign_Service_Honour_Cross_3rd_Class_ribbon.PNG' },

  // ─── FRANCE ─────────────────────────────────────────────────────────────────
  // Gallantry
  { country: 'France', branch: 'France Gallantry', name: 'Legion d'Honneur', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Legion_Honneur_Chevalier_ribbon.svg/250px-Legion_Honneur_Chevalier_ribbon.svg.png' },
  { country: 'France', branch: 'France Gallantry', name: 'Medaille Militaire', url: 'https://upload.wikimedia.org/wikipedia/commons/0/0c/Ruban_de_la_M%C3%A9daille_militaire.PNG' },
  { country: 'France', branch: 'France Gallantry', name: 'Croix de Guerre - Theatres d'Operations Exterieures', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Croix_de_Guerre_des_Theatres_d%27Operations_Exterieurs_ribbon.svg/250px-Croix_de_Guerre_des_Theatres_d%27Operations_Exterieurs_ribbon.svg.png' },
  { country: 'France', branch: 'France Gallantry', name: 'Croix de la Valeur Militaire', url: 'https://upload.wikimedia.org/wikipedia/commons/a/af/Ruban_de_la_Croix_de_la_Valeur_militaire.PNG' },
  { country: 'France', branch: 'France Gallantry', name: 'Croix de la Valeur Militaire - Etoile de Bronze', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Croix_de_la_Valeur_Militaire_avec_l%27etoile_bronze_ribbon.svg/250px-Croix_de_la_Valeur_Militaire_avec_l%27etoile_bronze_ribbon.svg.png' },
  { country: 'France', branch: 'France Gallantry', name: 'Croix de la Valeur Militaire - Etoile d\'Argent', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Croix_de_la_Valeur_Militaire_avec_l%27etoile_argent_ribbon.svg/250px-Croix_de_la_Valeur_Militaire_avec_l%27etoile_argent_ribbon.svg.png' },
  { country: 'France', branch: 'France Gallantry', name: 'Croix de la Valeur Militaire - Etoile de Vermeil', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Croix_de_la_Valeur_Militaire_avec_l%27etoile_vermeil_ribbon.svg/250px-Croix_de_la_Valeur_Militaire_avec_l%27etoile_vermeil_ribbon.svg.png' },
  { country: 'France', branch: 'France Gallantry', name: 'Croix de la Valeur Militaire - Palme de Bronze', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Croix_de_la_Valeur_militaire_avec_palme_de_bronze.svg/250px-Croix_de_la_Valeur_militaire_avec_palme_de_bronze.svg.png' },
  { country: 'France', branch: 'France Gallantry', name: 'Croix du Combattant', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Croix_du_Combattant_%281930_France%29_ribbon.svg/250px-Croix_du_Combattant_%281930_France%29_ribbon.svg.png' },
  { country: 'France', branch: 'France Gallantry', name: 'Croix du Combattant Volontaire (1983)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Croix_du_Combattant_Volontaire_1939-1945_ribbon.svg/250px-Croix_du_Combattant_Volontaire_1939-1945_ribbon.svg.png' },
  // Orders & Distinguished Service
  { country: 'France', branch: 'France Orders & Distinguished Service', name: 'Ordre National du Merite', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Ordre_national_du_Merite_Chevalier_ribbon.svg/250px-Ordre_national_du_Merite_Chevalier_ribbon.svg.png' },
  { country: 'France', branch: 'France Orders & Distinguished Service', name: 'Ordre National du Merite - Officier', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Ordre_national_du_Merite_Officier_ribbon.svg/250px-Ordre_national_du_Merite_Officier_ribbon.svg.png' },
  { country: 'France', branch: 'France Orders & Distinguished Service', name: 'Ordre National du Merite - Commandeur', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Ordre_national_du_Merite_Commandeur_ribbon.svg/250px-Ordre_national_du_Merite_Commandeur_ribbon.svg.png' },
  { country: 'France', branch: 'France Orders & Distinguished Service', name: 'Ordre National du Merite - Grand Officier', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Ordre_national_du_Merite_GO_ribbon.svg/250px-Ordre_national_du_Merite_GO_ribbon.svg.png' },
  { country: 'France', branch: 'France Orders & Distinguished Service', name: 'Ordre National du Merite - Grand Croix', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Ordre_national_du_Merite_GC_ribbon.svg/250px-Ordre_national_du_Merite_GC_ribbon.svg.png' },
  // Service Medals
  { country: 'France', branch: 'France Service Medals', name: 'Medaille de la Defense Nationale - Bronze', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Medaille_de_la_Defense_Nationale_Bronze_ribbon.svg/250px-Medaille_de_la_Defense_Nationale_Bronze_ribbon.svg.png' },
  { country: 'France', branch: 'France Service Medals', name: 'Medaille de la Defense Nationale - Argent', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Medaille_de_la_Defense_Nationale_Argent_ribbon.svg/250px-Medaille_de_la_Defense_Nationale_Argent_ribbon.svg.png' },
  { country: 'France', branch: 'France Service Medals', name: 'Medaille de la Defense Nationale - Or', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Medaille_de_la_Defense_Nationale_Or_ribbon.svg/250px-Medaille_de_la_Defense_Nationale_Or_ribbon.svg.png' },
  { country: 'France', branch: 'France Service Medals', name: 'Medaille de la Defense Nationale - Or avec Citation', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Medaille_d%27Or_de_la_Defense_Nationale_pour_citation_sans_croix_ribbon.svg/250px-Medaille_d%27Or_de_la_Defense_Nationale_pour_citation_sans_croix_ribbon.svg.png' },
  { country: 'France', branch: 'France Service Medals', name: 'Medaille d'Outre-Mer', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Medaille_d%27Outre-Mer_%28Coloniale%29_ribbon.svg/250px-Medaille_d%27Outre-Mer_%28Coloniale%29_ribbon.svg.png' },
  { country: 'France', branch: 'France Service Medals', name: 'Medaille des Services Militaires Volontaires - Bronze', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Medaille_des_Services_Militaires_Volontaires_Bronze_ribbon.svg/250px-Medaille_des_Services_Militaires_Volontaires_Bronze_ribbon.svg.png' },
  { country: 'France', branch: 'France Service Medals', name: 'Medaille des Services Militaires Volontaires - Argent', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Medaille_des_Services_Militaires_Volontaires_Argent_ribbon.svg/250px-Medaille_des_Services_Militaires_Volontaires_Argent_ribbon.svg.png' },
  { country: 'France', branch: 'France Service Medals', name: 'Medaille des Services Militaires Volontaires - Or', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Medaille_des_Services_Militaires_Volontaires_Or_ribbon.svg/250px-Medaille_des_Services_Militaires_Volontaires_Or_ribbon.svg.png' },
  { country: 'France', branch: 'France Service Medals', name: 'Medaille des Blesses de Guerre', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Medaille_%28Insigne%29_des_Blesses_Militaires_ribbon.svg/250px-Medaille_%28Insigne%29_des_Blesses_Militaires_ribbon.svg.png' },
  { country: 'France', branch: 'France Service Medals', name: 'Medaille d'honneur du Service de Sante des Armees', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Medaille_d%27honneur_du_Service_de_Sante_des_Armees_Bronze_ribbon.svg/250px-Medaille_d%27honneur_du_Service_de_Sante_des_Armees_Bronze_ribbon.svg.png' },
  // Campaign Medals
  { country: 'France', branch: 'France Campaign Medals', name: 'Medaille Commemorative Francaise (Operations Exterieures)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Medaille_commemorative_Francaise_ribbon.svg/250px-Medaille_commemorative_Francaise_ribbon.svg.png' },
  { country: 'France', branch: 'France Campaign Medals', name: 'Medaille de la Protection Militaire du Territoire', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Medaille_de_la_protection_militaire_du_territoire.svg/250px-Medaille_de_la_protection_militaire_du_territoire.svg.png' },

  // ─── ITALY ──────────────────────────────────────────────────────────────────
  // Orders - OMRI (Order of Merit of the Italian Republic) - all 6 grades
  { country: 'Italy', branch: 'Italy Orders', name: 'Order of Merit of the Republic (OMRI) - Cavaliere', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/ITA_OMRI_2001_Cav_BAR.svg/250px-ITA_OMRI_2001_Cav_BAR.svg.png' },
  { country: 'Italy', branch: 'Italy Orders', name: 'Order of Merit of the Republic (OMRI) - Ufficiale', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/ITA_OMRI_2001_Uff_BAR.svg/250px-ITA_OMRI_2001_Uff_BAR.svg.png' },
  { country: 'Italy', branch: 'Italy Orders', name: 'Order of Merit of the Republic (OMRI) - Commendatore', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/ITA_OMRI_2001_Com_BAR.svg/250px-ITA_OMRI_2001_Com_BAR.svg.png' },
  { country: 'Italy', branch: 'Italy Orders', name: 'Order of Merit of the Republic (OMRI) - Grande Ufficiale', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/ITA_OMRI_2001_GUff_BAR.svg/250px-ITA_OMRI_2001_GUff_BAR.svg.png' },
  { country: 'Italy', branch: 'Italy Orders', name: 'Order of Merit of the Republic (OMRI) - Gran Croce', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/ITA_OMRI_2001_GC_BAR.svg/250px-ITA_OMRI_2001_GC_BAR.svg.png' },
  { country: 'Italy', branch: 'Italy Orders', name: 'Order of Merit of the Republic (OMRI) - Gran Cordone', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/ITA_OMRI_2001_GC-GCord_BAR.svg/250px-ITA_OMRI_2001_GC-GCord_BAR.svg.png' },
  // Military Order of Italy (OMI)
  { country: 'Italy', branch: 'Italy Orders', name: 'Military Order of Italy (OMI)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Cavaliere_BAR.svg/250px-Cavaliere_BAR.svg.png' },
  // Order of Saints Maurice and Lazarus (SSML) - 3 confirmed grades
  { country: 'Italy', branch: 'Italy Orders', name: 'Order of Saints Maurice and Lazarus (SSML) - Cavaliere', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Cavaliere_SSML_BAR.svg/250px-Cavaliere_SSML_BAR.svg.png' },
  { country: 'Italy', branch: 'Italy Orders', name: 'Order of Saints Maurice and Lazarus (SSML) - Ufficiale', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Ufficiale_SSML_BAR.svg/250px-Ufficiale_SSML_BAR.svg.png' },
  { country: 'Italy', branch: 'Italy Orders', name: 'Order of Saints Maurice and Lazarus (SSML) - Commendatore', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Commendatore_SSML_BAR.svg/250px-Commendatore_SSML_BAR.svg.png' },
  // Medal of Military Valor - 3 grades
  { country: 'Italy', branch: 'Italy Gallantry & Crosses', name: 'Medal of Military Valor - Gold', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Valor_militare_gold_medal_BAR.svg/250px-Valor_militare_gold_medal_BAR.svg.png' },
  { country: 'Italy', branch: 'Italy Gallantry & Crosses', name: 'Medal of Military Valor - Silver', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Valor_militare_silver_medal_BAR.svg/250px-Valor_militare_silver_medal_BAR.svg.png' },
  { country: 'Italy', branch: 'Italy Gallantry & Crosses', name: 'Medal of Military Valor - Bronze', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Valor_militare_bronze_medal_BAR.svg/250px-Valor_militare_bronze_medal_BAR.svg.png' },
  // War Crosses
  { country: 'Italy', branch: 'Italy Gallantry & Crosses', name: 'War Cross for Military Valor', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Croce_di_guerra_al_valor_militare_BAR.svg/250px-Croce_di_guerra_al_valor_militare_BAR.svg.png' },
  { country: 'Italy', branch: 'Italy Gallantry & Crosses', name: 'War Merit Cross', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Croce_di_guerra_al_merito_BAR.svg/250px-Croce_di_guerra_al_merito_BAR.svg.png' },
  { country: 'Italy', branch: 'Italy Gallantry & Crosses', name: 'War Merit Cross with Silver Clasp', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Croce_di_guerra_al_merito_SC_BAR.svg/250px-Croce_di_guerra_al_merito_SC_BAR.svg.png' },
  // Medal of Valor of the Army - 3 grades
  { country: 'Italy', branch: 'Italy Gallantry & Crosses', name: 'Medal of Valor of the Army - Gold', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Valor_dell%27esercito_gold_medal_BAR.svg/250px-Valor_dell%27esercito_gold_medal_BAR.svg.png' },
  { country: 'Italy', branch: 'Italy Gallantry & Crosses', name: 'Medal of Valor of the Army - Silver', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Valor_dell%27esercito_silver_medal_BAR.svg/250px-Valor_dell%27esercito_silver_medal_BAR.svg.png' },
  { country: 'Italy', branch: 'Italy Gallantry & Crosses', name: 'Medal of Valor of the Army - Bronze', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Valor_dell%27esercito_bronze_medal_BAR.svg/250px-Valor_dell%27esercito_bronze_medal_BAR.svg.png' },
  // Medal of Valor of the Navy - 3 grades
  { country: 'Italy', branch: 'Italy Gallantry & Crosses', name: 'Medal of Valor of the Navy - Gold', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Valor_di_marina_gold_medal_2010_BAR.svg/250px-Valor_di_marina_gold_medal_2010_BAR.svg.png' },
  { country: 'Italy', branch: 'Italy Gallantry & Crosses', name: 'Medal of Valor of the Navy - Silver', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Valor_di_marina_silver_medal_BAR.svg/250px-Valor_di_marina_silver_medal_BAR.svg.png' },
  { country: 'Italy', branch: 'Italy Gallantry & Crosses', name: 'Medal of Valor of the Navy - Bronze', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Valor_di_marina_bronze_medal_BAR.svg/250px-Valor_di_marina_bronze_medal_BAR.svg.png' },
  // Medal of Valor of the Air Forces - 3 grades
  { country: 'Italy', branch: 'Italy Gallantry & Crosses', name: 'Medal of Valor of the Air Forces - Gold', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Valor_aeronautico_gold_medal_2010_BAR.svg/250px-Valor_aeronautico_gold_medal_2010_BAR.svg.png' },
  { country: 'Italy', branch: 'Italy Gallantry & Crosses', name: 'Medal of Valor of the Air Forces - Silver', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Valor_aeronautico_silver_medal_BAR.svg/250px-Valor_aeronautico_silver_medal_BAR.svg.png' },
  { country: 'Italy', branch: 'Italy Gallantry & Crosses', name: 'Medal of Valor of the Air Forces - Bronze', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Valor_aeronautico_bronze_medal_BAR.svg/250px-Valor_aeronautico_bronze_medal_BAR.svg.png' },
  // Medal of Valor of the Carabinieri - 3 grades
  { country: 'Italy', branch: 'Italy Gallantry & Crosses', name: 'Medal of Valor of the Carabinieri - Gold', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Valor_dei_carabinieri_gold_medal_BAR.svg/250px-Valor_dei_carabinieri_gold_medal_BAR.svg.png' },
  { country: 'Italy', branch: 'Italy Gallantry & Crosses', name: 'Medal of Valor of the Carabinieri - Silver', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Valor_dei_carabinieri_silver_medal_BAR.svg/250px-Valor_dei_carabinieri_silver_medal_BAR.svg.png' },
  { country: 'Italy', branch: 'Italy Gallantry & Crosses', name: 'Medal of Valor of the Carabinieri - Bronze', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Valor_dei_carabinieri_bronze_medal_BAR.svg/250px-Valor_dei_carabinieri_bronze_medal_BAR.svg.png' },

  // ─── GREECE ─────────────────────────────────────────────────────────────────
  { country: 'Greece', branch: 'Greece Orders', name: 'Order of the Redeemer', url: 'https://www.medals.pl/gr/r/gr1ore.gif' },
  { country: 'Greece', branch: 'Greece Orders', name: 'Order of the Phoenix', url: 'https://www.medals.pl/gr/r/gr1oph.gif' },
  { country: 'Greece', branch: 'Greece Gallantry & Crosses', name: 'Cross of Valour', url: 'https://www.medals.pl/gr/r/gr1cva.gif' },
  { country: 'Greece', branch: 'Greece Gallantry & Crosses', name: 'Medal for Outstanding Acts', url: 'https://www.medals.pl/gr/r/gr1moab.gif' },

  // ─── NORWAY ─────────────────────────────────────────────────────────────────
  // Orders
  { country: 'Norway', branch: 'Norway Orders', name: 'Royal Norwegian Order of St. Olav', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/St._Olavs_Orden_stripe.svg/250px-St._Olavs_Orden_stripe.svg.png' },
  { country: 'Norway', branch: 'Norway Orders', name: 'Royal Norwegian Order of Merit', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Den_kongelige_norske_fortjenstorden.svg/250px-Den_kongelige_norske_fortjenstorden.svg.png' },
  // Gallantry
  { country: 'Norway', branch: 'Norway Gallantry', name: 'War Cross with Sword', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Krigskorset_med_sverd_stripe.svg/250px-Krigskorset_med_sverd_stripe.svg.png' },
  { country: 'Norway', branch: 'Norway Gallantry', name: 'War Cross', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Krigskorset_stripe.svg/250px-Krigskorset_stripe.svg.png' },
  { country: 'Norway', branch: 'Norway Gallantry', name: 'Norwegian Defence Cross of Honour', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Forsvarets_hederskors_stripe.svg/250px-Forsvarets_hederskors_stripe.svg.png' },
  { country: 'Norway', branch: 'Norway Gallantry', name: 'Armed Forces Medal for Heroic Deeds', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Forsvarets_medalje_for_edel_d%C3%A5d.svg/250px-Forsvarets_medalje_for_edel_d%C3%A5d.svg.png' },
  { country: 'Norway', branch: 'Norway Gallantry', name: 'Wounded in Action Medal', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Forsvarets_medalje_for_s%C3%A5rede_i_strid.svg/250px-Forsvarets_medalje_for_s%C3%A5rede_i_strid.svg.png' },
  // Service Medals
  { country: 'Norway', branch: 'Norway Service Medals', name: 'Defence Service Medal with Laurel Branch', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Forsvarsmedaljen_med_laurb%C3%A6rgren_stripe.svg/250px-Forsvarsmedaljen_med_laurb%C3%A6rgren_stripe.svg.png' },
  { country: 'Norway', branch: 'Norway Service Medals', name: 'Home Guard Medal of Merit', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Heimevernets_fortjenstmedalje_stripe.svg/250px-Heimevernets_fortjenstmedalje_stripe.svg.png' },
  { country: 'Norway', branch: 'Norway Service Medals', name: 'Army Medal of Merit', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/H%C3%A6rens_fortjenstmedalje_stripe.png/250px-H%C3%A6rens_fortjenstmedalje_stripe.png' },
  { country: 'Norway', branch: 'Norway Service Medals', name: 'Navy Medal of Merit', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Sj%C3%B8forsvarets_fortjenstmedalje_stripe.png/250px-Sj%C3%B8forsvarets_fortjenstmedalje_stripe.png' },
  { country: 'Norway', branch: 'Norway Service Medals', name: 'Air Force Medal of Merit', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Luftforsvarets_fortjenstmedalje_stripe.png/250px-Luftforsvarets_fortjenstmedalje_stripe.png' },
  { country: 'Norway', branch: 'Norway Service Medals', name: 'Intelligence Service Medal of Merit', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Etterretningstjenestens_fortjenstmedalje_stripe.png/250px-Etterretningstjenestens_fortjenstmedalje_stripe.png' },
  { country: 'Norway', branch: 'Norway Service Medals', name: 'Armed Forces Medal for International Operations', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Forsvarets_medalje_for_internasjonale_operasjoner_stripe.svg/250px-Forsvarets_medalje_for_internasjonale_operasjoner_stripe.svg.png' },
  // Long Service
  { country: 'Norway', branch: 'Norway Long Service', name: 'Defence Service Medal', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Forsvarsmedaljen_stripe.svg/250px-Forsvarsmedaljen_stripe.svg.png' },
  { country: 'Norway', branch: 'Norway Long Service', name: 'National Service Medal - Army', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Vernedyktighetsmedaljen_H%C3%A6ren_stripe.svg/250px-Vernedyktighetsmedaljen_H%C3%A6ren_stripe.svg.png' },
  { country: 'Norway', branch: 'Norway Long Service', name: 'National Service Medal - Navy', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Vernedyktighetsmedaljen_Sj%C3%B8forsvaret_stripe.svg/250px-Vernedyktighetsmedaljen_Sj%C3%B8forsvaret_stripe.svg.png' },
  { country: 'Norway', branch: 'Norway Long Service', name: 'National Service Medal - Air Force', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Vernedyktighetsmedaljen_Luftforsvaret_stripe.svg/250px-Vernedyktighetsmedaljen_Luftforsvaret_stripe.svg.png' },
  { country: 'Norway', branch: 'Norway Long Service', name: 'National Service Medal - Home Guard', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Vernedyktighetsmedaljen_Heimevernet_stripe.svg/250px-Vernedyktighetsmedaljen_Heimevernet_stripe.svg.png' },
  // Campaign Medals - Defence Service Abroad (older series)
  { country: 'Norway', branch: 'Norway Campaign Medals', name: 'Medal for Defence Service Abroad', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Forsvarets_innsatsmedalje_stripe.svg/250px-Forsvarets_innsatsmedalje_stripe.svg.png' },
  { country: 'Norway', branch: 'Norway Campaign Medals', name: 'Medal for Defence Service Abroad - Saudi Arabia', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Forsvarets_innsatsmedalje_-_Saudi_Arabia_stripe.svg/250px-Forsvarets_innsatsmedalje_-_Saudi_Arabia_stripe.svg.png' },
  { country: 'Norway', branch: 'Norway Campaign Medals', name: 'Medal for Defence Service Abroad - Balkans', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Forsvarets_innsatsmedalje_-_Balkan_stripe.svg/250px-Forsvarets_innsatsmedalje_-_Balkan_stripe.svg.png' },
  { country: 'Norway', branch: 'Norway Campaign Medals', name: 'Medal for Defence Service Abroad - Afghanistan', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Forsvarets_innsatsmedalje_med_rosett_-_Afghanistan_stripe.svg/250px-Forsvarets_innsatsmedalje_med_rosett_-_Afghanistan_stripe.svg.png' },
  // Campaign Medals - Defence Operations Abroad (newer series, theatre-specific)
  { country: 'Norway', branch: 'Norway Campaign Medals', name: 'Medal for Defence Operations Abroad - Kosovo', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Forsvarets_operasjonsmedalje_Kosovo_Serbia-Montenegro_stripe.svg/250px-Forsvarets_operasjonsmedalje_Kosovo_Serbia-Montenegro_stripe.svg.png' },
  { country: 'Norway', branch: 'Norway Campaign Medals', name: 'Medal for Defence Operations Abroad - Active Endeavour', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Forsvarets_operasjonsmedalje_Active_Endeavour_stripe.svg/250px-Forsvarets_operasjonsmedalje_Active_Endeavour_stripe.svg.png' },
  { country: 'Norway', branch: 'Norway Campaign Medals', name: 'Medal for Defence Operations Abroad - Afghanistan', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Forsvarets_operasjonsmedalje_Afghanistan_stripe.svg/250px-Forsvarets_operasjonsmedalje_Afghanistan_stripe.svg.png' },
  { country: 'Norway', branch: 'Norway Campaign Medals', name: 'Medal for Defence Operations Abroad - Iraq', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Forsvarets_operasjonsmedalje_Irak_stripe.svg/250px-Forsvarets_operasjonsmedalje_Irak_stripe.svg.png' },
  { country: 'Norway', branch: 'Norway Campaign Medals', name: 'Medal for Defence Operations Abroad - Baltic Accession', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Forsvarets_operasjonsmedalje_Baltic_Accession-Litauen_stripe.svg/250px-Forsvarets_operasjonsmedalje_Baltic_Accession-Litauen_stripe.svg.png' },
  { country: 'Norway', branch: 'Norway Campaign Medals', name: 'Medal for Defence Operations Abroad - Bosnia-Herzegovina', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Forsvarets_operasjonsmedalje_Bosnia_stripe.svg/250px-Forsvarets_operasjonsmedalje_Bosnia_stripe.svg.png' },
  { country: 'Norway', branch: 'Norway Campaign Medals', name: 'Medal for Defence Operations Abroad - Sudan', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Forsvarets_operasjonsmedalje_Sudan_stripe.svg/250px-Forsvarets_operasjonsmedalje_Sudan_stripe.svg.png' },
  { country: 'Norway', branch: 'Norway Campaign Medals', name: 'Medal for Defence Operations Abroad - Lebanon', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Forsvarets_operasjonsmedalje_Libanon_stripe.svg/250px-Forsvarets_operasjonsmedalje_Libanon_stripe.svg.png' },
  { country: 'Norway', branch: 'Norway Campaign Medals', name: 'Medal for Defence Operations Abroad - Chad', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Forsvarets_operasjonsmedalje_Tsjad_stripe.svg/250px-Forsvarets_operasjonsmedalje_Tsjad_stripe.svg.png' },
  { country: 'Norway', branch: 'Norway Campaign Medals', name: 'Medal for Defence Operations Abroad - Somalia', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Forsvarets_operasjonsmedalje_Somalia_stripe.svg/250px-Forsvarets_operasjonsmedalje_Somalia_stripe.svg.png' },
  { country: 'Norway', branch: 'Norway Campaign Medals', name: 'Medal for Defence Operations Abroad - Libya', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Forsvarets_operasjonsmedalje_Libya_stripe.svg/250px-Forsvarets_operasjonsmedalje_Libya_stripe.svg.png' },
  { country: 'Norway', branch: 'Norway Campaign Medals', name: 'Medal for Defence Operations Abroad - Syria', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Forsvarets_operasjonsmedalje_Syria_stripe.svg/250px-Forsvarets_operasjonsmedalje_Syria_stripe.svg.png' },
  { country: 'Norway', branch: 'Norway Campaign Medals', name: 'Medal for Defence Operations Abroad - Mali', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Forsvarets_operasjonsmedalje_Mali_stripe.png/250px-Forsvarets_operasjonsmedalje_Mali_stripe.png' },
  { country: 'Norway', branch: 'Norway Campaign Medals', name: 'Medal for Defence Operations Abroad - Mediterranean Sea', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Forsvarets_operasjonsmedalje_Middelhavet_stripe.png/250px-Forsvarets_operasjonsmedalje_Middelhavet_stripe.png' },
  // Commemorative
  { country: 'Norway', branch: 'Norway Commemorative', name: 'King Harald V's Jubilee Medal 1991-2016', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Kong_Harald_Vs_jubileumsmedalje_1991-2016.png/250px-Kong_Harald_Vs_jubileumsmedalje_1991-2016.png' },

  // ─── NETHERLANDS ────────────────────────────────────────────────────────────
  { country: 'Netherlands', branch: 'Netherlands Orders', name: 'Military Order of William', url: 'https://www.medals.pl/nl/r/nl1owi.gif' },
  { country: 'Netherlands', branch: 'Netherlands Orders', name: 'Order of Orange-Nassau', url: 'https://www.medals.pl/nl/r/nl1oon.gif' },
  { country: 'Netherlands', branch: 'Netherlands Gallantry & Crosses', name: 'Bronze Lion', url: 'https://www.medals.pl/nl/r/nl1bli.gif' },
  { country: 'Netherlands', branch: 'Netherlands Gallantry & Crosses', name: 'Bronze Cross', url: 'https://www.medals.pl/nl/r/nl1cbr.gif' },
  { country: 'Netherlands', branch: 'Netherlands Gallantry & Crosses', name: 'Flying Cross', url: 'https://www.medals.pl/nl/r/nl1cfl.gif' },
  { country: 'Netherlands', branch: 'Netherlands Gallantry & Crosses', name: 'Cross of Merit', url: 'https://www.medals.pl/nl/r/nl1cme.gif' },

  // ─── RUSSIA ─────────────────────────────────────────────────────────────────
  // Gallantry
  { country: 'Russia', branch: 'Russia Gallantry', name: 'Order of Saint George - 1st Class', url: 'https://upload.wikimedia.org/wikipedia/commons/b/bf/RUS_Order_of_Saint_George_1st_class_ribbon_2000.svg' },
  { country: 'Russia', branch: 'Russia Gallantry', name: 'Order of Saint George - 2nd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/4/47/RUS_Order_of_Saint_George_2nd_class_ribbon_2000.svg' },
  { country: 'Russia', branch: 'Russia Gallantry', name: 'Order of Saint George - 3rd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/3/3f/RUS_Order_of_Saint_George_3rd_class_ribbon_2000.svg' },
  { country: 'Russia', branch: 'Russia Gallantry', name: 'Order of Saint George - 4th Class', url: 'https://upload.wikimedia.org/wikipedia/commons/1/18/RUS_Order_of_Saint_George_4th_class_ribbon_2000.svg' },
  { country: 'Russia', branch: 'Russia Gallantry', name: 'Cross of Saint George - 1st Class', url: 'https://upload.wikimedia.org/wikipedia/commons/1/1c/RUS_Cross_of_Saint_George_1st_class_ribbon_2000.svg' },
  { country: 'Russia', branch: 'Russia Gallantry', name: 'Cross of Saint George - 2nd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/7/78/RUS_Cross_of_Saint_George_2nd_class_ribbon_2000.svg' },
  { country: 'Russia', branch: 'Russia Gallantry', name: 'Cross of Saint George - 3rd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/RUS_Cross_of_Saint_George_3rd_class_ribbon_2000.svg' },
  { country: 'Russia', branch: 'Russia Gallantry', name: 'Cross of Saint George - 4th Class', url: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/RUS_Cross_of_Saint_George_4th_class_ribbon_2000.svg' },
  { country: 'Russia', branch: 'Russia Gallantry', name: 'Order of Courage', url: 'https://upload.wikimedia.org/wikipedia/commons/f/f5/RUS_Order_of_Courage_ribbon.svg' },
  { country: 'Russia', branch: 'Russia Gallantry', name: 'Medal for Courage', url: 'https://upload.wikimedia.org/wikipedia/commons/f/f5/RUS_Medal_For_Courage_ribbon.svg' },
  { country: 'Russia', branch: 'Russia Gallantry', name: 'Medal for Bravery - 1st Class', url: 'https://upload.wikimedia.org/wikipedia/commons/5/56/RUS_Medal_for_Bravery_1-st_BAR_2023.svg' },
  { country: 'Russia', branch: 'Russia Gallantry', name: 'Medal for Bravery - 2nd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/b/bd/RUS_Medal_for_Bravery_2-st_BAR_2023.svg' },
  { country: 'Russia', branch: 'Russia Gallantry', name: 'Order of Saint Andrew the Apostle (with Swords)', url: 'https://upload.wikimedia.org/wikipedia/commons/9/97/RUS_Saint_Andrew_the_Apostle_the_First-Called_Order_with_swords_ribbon.svg' },
  // Orders & Distinguished Service
  { country: 'Russia', branch: 'Russia Orders & Distinguished Service', name: 'Order of Alexander Nevsky', url: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Order_of_Alexander_Nevsky_2010_ribbon.svg' },
  { country: 'Russia', branch: 'Russia Orders & Distinguished Service', name: 'Order of Suvorov', url: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/RUS_Order_of_Suvorov_ribbon_2010.svg' },
  { country: 'Russia', branch: 'Russia Orders & Distinguished Service', name: 'Order of Kutuzov', url: 'https://upload.wikimedia.org/wikipedia/commons/a/a3/RUS_Order_of_Kutuzov_ribbon_2010.svg' },
  { country: 'Russia', branch: 'Russia Orders & Distinguished Service', name: 'Order of Ushakov', url: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/RUS_Order_of_Ushakov_ribbon_2010.svg' },
  { country: 'Russia', branch: 'Russia Orders & Distinguished Service', name: 'Order of Nakhimov', url: 'https://upload.wikimedia.org/wikipedia/commons/8/8e/RUS_Order_of_Nakhimov_ribbon_2010.svg' },
  { country: 'Russia', branch: 'Russia Orders & Distinguished Service', name: 'Order of Zhukov', url: 'https://upload.wikimedia.org/wikipedia/commons/8/80/RUS_Order_of_Zhukov_ribbon.svg' },
  { country: 'Russia', branch: 'Russia Orders & Distinguished Service', name: 'Order of Military Merit', url: 'https://upload.wikimedia.org/wikipedia/commons/9/93/RUS_Order_of_Military_Merit_ribbon.svg' },
  { country: 'Russia', branch: 'Russia Orders & Distinguished Service', name: 'Order of Naval Merit', url: 'https://upload.wikimedia.org/wikipedia/commons/c/c0/RUS_Order_of_Naval_Merit_ribbon.svg' },
  { country: 'Russia', branch: 'Russia Orders & Distinguished Service', name: 'Order For Merit to the Fatherland - 3rd Class (with Swords)', url: 'https://upload.wikimedia.org/wikipedia/commons/b/b0/RUS_For_Merit_to_the_Fatherland_Order_3rd_class_with_swords_ribbon.svg' },
  { country: 'Russia', branch: 'Russia Orders & Distinguished Service', name: 'Order For Merit to the Fatherland - 4th Class (with Swords)', url: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/RUS_For_Merit_to_the_Fatherland_Order_4th_class_with_swords_ribbon.svg' },
  // Commendations
  { country: 'Russia', branch: 'Russia Commendations', name: 'Medal of Suvorov', url: 'https://upload.wikimedia.org/wikipedia/commons/6/66/RUS_Medal_of_Suvorov_ribbon.svg' },
  { country: 'Russia', branch: 'Russia Commendations', name: 'Medal of Ushakov', url: 'https://upload.wikimedia.org/wikipedia/commons/2/2d/RUS_Medal_of_Ushakov_ribbon.svg' },
  { country: 'Russia', branch: 'Russia Commendations', name: 'Medal of Zhukov', url: 'https://upload.wikimedia.org/wikipedia/commons/c/c6/RUS_Medal_of_Zhukov_ribbon.svg' },
  { country: 'Russia', branch: 'Russia Commendations', name: 'Medal of Nesterov', url: 'https://upload.wikimedia.org/wikipedia/commons/2/23/RUS_Medal_of_Nesterov_ribbon.svg' },
  { country: 'Russia', branch: 'Russia Commendations', name: 'Medal for Distinction in Protection of State Borders', url: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/RUS_Medal_For_Distinction_in_the_Protection_of_the_State_Borders_ribbon.svg' },


  // ─── AUSTRIA ──────────────────────────────────────────────────────────────
  // Gallantry
  { country: 'Austria', branch: 'Austria Gallantry', name: 'Wound Medal - 1st Wound', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/AUT_Verwundetenmedaille_BAR.svg/250px-AUT_Verwundetenmedaille_BAR.svg.png' },
  { country: 'Austria', branch: 'Austria Gallantry', name: 'Wound Medal - 2nd Wound', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/AUT_Verwundetenmedaille_2x_BAR.svg/250px-AUT_Verwundetenmedaille_2x_BAR.svg.png' },
  // Commendations
  { country: 'Austria', branch: 'Austria Commendations', name: 'Military Recognition Medal', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/AUT_Milit%C3%A4r-Anerkennungsmedaille_BAR.svg/250px-AUT_Milit%C3%A4r-Anerkennungsmedaille_BAR.svg.png' },
  // Campaign Medals
  { country: 'Austria', branch: 'Austria Campaign Medals', name: 'Armed Forces Operations Medal - Foreign Operations', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/AUT_Einsatzmedaille_a_BAR.svg/250px-AUT_Einsatzmedaille_a_BAR.svg.png' },
  // Service Medals
  { country: 'Austria', branch: 'Austria Service Medals', name: 'Armed Forces Operations Medal - Military Defence', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/AUT_Einsatzmedaille_d_BAR.svg/250px-AUT_Einsatzmedaille_d_BAR.svg.png' },
  // Long Service
  { country: 'Austria', branch: 'Austria Long Service', name: 'Military Service Award - 1st Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/AUT_Wehrdienstzeichen_1._Klasse_BAR.svg/250px-AUT_Wehrdienstzeichen_1._Klasse_BAR.svg.png' },
  { country: 'Austria', branch: 'Austria Long Service', name: 'Military Service Award - 2nd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/AUT_Wehrdienstzeichen_2._Klasse_BAR.svg/250px-AUT_Wehrdienstzeichen_2._Klasse_BAR.svg.png' },
  { country: 'Austria', branch: 'Austria Long Service', name: 'Military Service Award - 3rd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/AUT_Wehrdienstzeichen_3._Klasse_BAR.svg/250px-AUT_Wehrdienstzeichen_3._Klasse_BAR.svg.png' },
  { country: 'Austria', branch: 'Austria Long Service', name: 'Militia Medal', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/AUT_Milizmedaille_BAR.svg/250px-AUT_Milizmedaille_BAR.svg.png' },


  // ─── ESTONIA ──────────────────────────────────────────────────────────────
  // Gallantry
  { country: 'Estonia', branch: 'Estonia Gallantry', name: 'Cross of Liberty - 1st Division', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/EST_Cross_of_Liberty_I_division_ribbon.svg/250px-EST_Cross_of_Liberty_I_division_ribbon.svg.png' },
  { country: 'Estonia', branch: 'Estonia Gallantry', name: 'Cross of Liberty - 2nd Division', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/EST_Cross_of_Liberty_II_division_ribbon.svg/250px-EST_Cross_of_Liberty_II_division_ribbon.svg.png' },
  { country: 'Estonia', branch: 'Estonia Gallantry', name: 'Cross of Liberty - 3rd Division', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/EST_Cross_of_Liberty_III_division_ribbon.svg/250px-EST_Cross_of_Liberty_III_division_ribbon.svg.png' },
  { country: 'Estonia', branch: 'Estonia Gallantry', name: 'Defence Forces Decoration for Battle Merit', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/EST_Defence_Forces_Decoration_for_battle_merit_ribbon.svg/250px-EST_Defence_Forces_Decoration_for_battle_merit_ribbon.svg.png' },
  { country: 'Estonia', branch: 'Estonia Gallantry', name: 'Navy Cross', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/EST_Navy_Cross_ribbon.svg/250px-EST_Navy_Cross_ribbon.svg.png' },
  // Commendations
  { country: 'Estonia', branch: 'Estonia Commendations', name: 'Defence Forces Decoration for Defence Merit', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/EST_Defence_Forces_Decoration_for_defence_merit_ribbon.svg/250px-EST_Defence_Forces_Decoration_for_defence_merit_ribbon.svg.png' },
  { country: 'Estonia', branch: 'Estonia Commendations', name: 'Defence Forces Merit Cross for Meritorious Service', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/EST_Defence_Forces_Merit_Cross_for_meritorious_service_ribbon.svg/250px-EST_Defence_Forces_Merit_Cross_for_meritorious_service_ribbon.svg.png' },
  { country: 'Estonia', branch: 'Estonia Commendations', name: 'Defence Forces Merit Cross for National Defence Merit', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/EST_Defence_Forces_Merit_Cross_for_national_defence_merit_ribbon.svg/250px-EST_Defence_Forces_Merit_Cross_for_national_defence_merit_ribbon.svg.png' },
  // Long Service
  { country: 'Estonia', branch: 'Estonia Long Service', name: 'Long Service Medal', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/EST_Kaitsev%C3%A4e_pikaajalise_teenistuse_medal.png/250px-EST_Kaitsev%C3%A4e_pikaajalise_teenistuse_medal.png' },
  { country: 'Estonia', branch: 'Estonia Long Service', name: 'White Cross of the Estonian Defence League - 1st Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/EST_White_Cross_of_the_Estonian_Defence_League_1st_class_ribbon.svg/250px-EST_White_Cross_of_the_Estonian_Defence_League_1st_class_ribbon.svg.png' },
  { country: 'Estonia', branch: 'Estonia Long Service', name: 'White Cross of the Estonian Defence League - 2nd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/EST_White_Cross_of_the_Estonian_Defence_League_2nd_class_ribbon.svg/250px-EST_White_Cross_of_the_Estonian_Defence_League_2nd_class_ribbon.svg.png' },
  { country: 'Estonia', branch: 'Estonia Long Service', name: 'White Cross of the Estonian Defence League - 3rd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/EST_White_Cross_of_the_Estonian_Defence_League_3rd_class_ribbon.svg/250px-EST_White_Cross_of_the_Estonian_Defence_League_3rd_class_ribbon.svg.png' },
  // Commemorative
  { country: 'Estonia', branch: 'Estonia Commemorative', name: 'Memorial Medal - 10 Years of the Re-Established Defence Forces', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/EST_Memorial_Medal_10_Years_of_the_Re-Established_Defence_Forces.png/250px-EST_Memorial_Medal_10_Years_of_the_Re-Established_Defence_Forces.png' },


  // ─── FINLAND ──────────────────────────────────────────────────────────────
  // Gallantry
  { country: 'Finland', branch: 'Finland Gallantry', name: 'Order of the Cross of Liberty - Grand Cross (Military)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/FIN_Order_of_the_Cross_of_Liberty_GCross_peace_military_BAR.svg/250px-FIN_Order_of_the_Cross_of_Liberty_GCross_peace_military_BAR.svg.png' },
  { country: 'Finland', branch: 'Finland Gallantry', name: 'Order of the Cross of Liberty - 1st Class with Star (Military)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/FIN_Order_of_the_Cross_of_Liberty_1Class_Star_peace_military_BAR.svg/250px-FIN_Order_of_the_Cross_of_Liberty_1Class_Star_peace_military_BAR.svg.png' },
  { country: 'Finland', branch: 'Finland Gallantry', name: 'Order of the Cross of Liberty - 1st Class (Military)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/FIN_Order_of_the_Cross_of_Liberty_1Class_peace_military_BAR.svg/250px-FIN_Order_of_the_Cross_of_Liberty_1Class_peace_military_BAR.svg.png' },
  { country: 'Finland', branch: 'Finland Gallantry', name: 'Order of the Cross of Liberty - 2nd Class (Military)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/FIN_Order_of_the_Cross_of_Liberty_2Class_peace_military_BAR.svg/250px-FIN_Order_of_the_Cross_of_Liberty_2Class_peace_military_BAR.svg.png' },
  { country: 'Finland', branch: 'Finland Gallantry', name: 'Order of the Cross of Liberty - 3rd Class (Military)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/FIN_Order_of_the_Cross_of_Liberty_3Class_peace_military_BAR.svg/250px-FIN_Order_of_the_Cross_of_Liberty_3Class_peace_military_BAR.svg.png' },
  { country: 'Finland', branch: 'Finland Gallantry', name: 'Order of the Cross of Liberty - 4th Class (Military)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/FIN_Order_of_the_Cross_of_Liberty_4Class_peace_military_BAR.svg/250px-FIN_Order_of_the_Cross_of_Liberty_4Class_peace_military_BAR.svg.png' },
  // Commendations
  { country: 'Finland', branch: 'Finland Commendations', name: 'Medal for Military Merits', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/FIN_Military_Merit_Medal_BAR.svg/250px-FIN_Military_Merit_Medal_BAR.svg.png' },
  // Long Service / Liberty Medals
  { country: 'Finland', branch: 'Finland Long Service', name: 'Order of the Cross of Liberty - Liberty Medal 1st Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/FIN_Order_of_the_Cross_of_Liberty_Medal_1Class_BAR.svg/250px-FIN_Order_of_the_Cross_of_Liberty_Medal_1Class_BAR.svg.png' },
  { country: 'Finland', branch: 'Finland Long Service', name: 'Order of the Cross of Liberty - Liberty Medal 2nd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/FIN_Order_of_the_Cross_of_Liberty_Medal_2Class_BAR.svg/250px-FIN_Order_of_the_Cross_of_Liberty_Medal_2Class_BAR.svg.png' },
  { country: 'Finland', branch: 'Finland Long Service', name: 'Order of the Cross of Liberty - Medal of Merit (Gold)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/FIN_Order_of_the_Cross_of_Liberty_Medal_Merit_BAR.svg/250px-FIN_Order_of_the_Cross_of_Liberty_Medal_Merit_BAR.svg.png' },


  // ─── CROATIA ──────────────────────────────────────────────────────────────
  // Orders & Distinguished Service
  { country: 'Croatia', branch: 'Croatia Orders & Distinguished Service', name: 'Grand Order of King Tomislav', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Ribbon_of_an_order_of_king_Tomislav.png/250px-Ribbon_of_an_order_of_king_Tomislav.png' },
  { country: 'Croatia', branch: 'Croatia Orders & Distinguished Service', name: 'Order of Ban Jelacic', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Ribbon_of_an_Order_of_Ban_Jela%C4%8Di%C4%87.png/250px-Ribbon_of_an_Order_of_Ban_Jela%C4%8Di%C4%87.png' },
  { country: 'Croatia', branch: 'Croatia Orders & Distinguished Service', name: 'Order of the Croatian Cross', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Ribbon_of_an_Order_of_the_Croatian_Cross.png/250px-Ribbon_of_an_Order_of_the_Croatian_Cross.png' },
  // Gallantry
  { country: 'Croatia', branch: 'Croatia Gallantry', name: 'Order of Duke Trpimir', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Ribbon_of_the_Order_of_Duke_Trpimir.png/250px-Ribbon_of_the_Order_of_Duke_Trpimir.png' },
  { country: 'Croatia', branch: 'Croatia Gallantry', name: 'Order of Duke Domagoj', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Ribbon_of_an_Order_of_Duke_Domagoj.png/250px-Ribbon_of_an_Order_of_Duke_Domagoj.png' },
  { country: 'Croatia', branch: 'Croatia Gallantry', name: 'Order of Nikola Subic Zrinski', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Ribbon_of_an_Order_of_Nikola_%C5%A0ubi%C4%87_Zrinski.png/250px-Ribbon_of_an_Order_of_Nikola_%C5%A0ubi%C4%87_Zrinski.png' },
  // Campaign Medals
  { country: 'Croatia', branch: 'Croatia Campaign Medals', name: 'Homeland\'s Gratitude Medal', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Homelands_Gratitude_Medal.jpg/250px-Homelands_Gratitude_Medal.jpg' },
  { country: 'Croatia', branch: 'Croatia Campaign Medals', name: 'Homeland Medal - Gold', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Zlatna_domovinska_medalja_-_mala_oznaka.jpg/250px-Zlatna_domovinska_medalja_-_mala_oznaka.jpg' },
  { country: 'Croatia', branch: 'Croatia Campaign Medals', name: 'Homeland Medal - Silver', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Srebrna_domovinska_medalja_-_mala_oznaka.jpg/250px-Srebrna_domovinska_medalja_-_mala_oznaka.jpg' },
  { country: 'Croatia', branch: 'Croatia Campaign Medals', name: 'Homeland Medal - Bronze', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Bron%C4%8Dana_domovinska_medalja_-_mala_oznaka.jpg/250px-Bron%C4%8Dana_domovinska_medalja_-_mala_oznaka.jpg' },
  // Service Medals
  { country: 'Croatia', branch: 'Croatia Service Medals', name: 'Medal of the Croatian Armed Forces - Gold', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Zlatna_medalja_Hrvatske_vojske_-_mala_oznaka.jpg/250px-Zlatna_medalja_Hrvatske_vojske_-_mala_oznaka.jpg' },
  { country: 'Croatia', branch: 'Croatia Service Medals', name: 'Medal of the Croatian Armed Forces - Silver', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Srebrna_medalja_Hrvatske_vojske.jpg/250px-Srebrna_medalja_Hrvatske_vojske.jpg' },
  { country: 'Croatia', branch: 'Croatia Service Medals', name: 'Medal of the Croatian Armed Forces - Bronze', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Bron%C4%8Dana_medalja_Hrvatske_vojske_-_mala_oznaka.jpg/250px-Bron%C4%8Dana_medalja_Hrvatske_vojske_-_mala_oznaka.jpg' },


  // ─── SWITZERLAND ──────────────────────────────────────────────────────────
  // Gallantry
  { country: 'Switzerland', branch: 'Switzerland Gallantry', name: 'Exceptional Service Decoration (Chef de l\'Armee)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/CHE_CdA_decoration.svg/250px-CHE_CdA_decoration.svg.png' },
  // Long Service
  { country: 'Switzerland', branch: 'Switzerland Long Service', name: 'Length of Service Decoration', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/CHE_Length_of_service_decoration.svg/250px-CHE_Length_of_service_decoration.svg.png' },
  // Service Medals / Specialist
  { country: 'Switzerland', branch: 'Switzerland Service Medals', name: 'Alpine Decoration', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/CHE_Alpine_Decoration.png/250px-CHE_Alpine_Decoration.png' },
  { country: 'Switzerland', branch: 'Switzerland Service Medals', name: 'Skill-at-Arms - Assault Rifle Level 1', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/CHE_Skill-at-arms_decoration_Assault_rifle_level_1.png/250px-CHE_Skill-at-arms_decoration_Assault_rifle_level_1.png' },
  { country: 'Switzerland', branch: 'Switzerland Service Medals', name: 'Skill-at-Arms - Assault Rifle Level 2', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/CHE_Skill-at-arms_decoration_Assault_rifle_level_2.png/250px-CHE_Skill-at-arms_decoration_Assault_rifle_level_2.png' },
  { country: 'Switzerland', branch: 'Switzerland Service Medals', name: 'Skill-at-Arms - Pistol Level 1', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/CHE_Skill-at-arms_decoration_Pistol_level_1.png/250px-CHE_Skill-at-arms_decoration_Pistol_level_1.png' },
  { country: 'Switzerland', branch: 'Switzerland Service Medals', name: 'Skill-at-Arms - Pistol Level 2', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/CHE_Skill-at-arms_decoration_Pistol_level_2.png/250px-CHE_Skill-at-arms_decoration_Pistol_level_2.png' },
  // Campaign Medals / Mission Insignia
  { country: 'Switzerland', branch: 'Switzerland Campaign Medals', name: 'Operations within Switzerland (Inland-Einsatze)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/CHE_Mission_Insignia_Operations_within_Switzerland.png/250px-CHE_Mission_Insignia_Operations_within_Switzerland.png' },
  { country: 'Switzerland', branch: 'Switzerland Campaign Medals', name: 'Kosovo Mission Insignia (SWISSCOY)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/CHE_Operations_abroad_Kosovo_%28SWISSCOY%29.png/250px-CHE_Operations_abroad_Kosovo_%28SWISSCOY%29.png' },
  { country: 'Switzerland', branch: 'Switzerland Campaign Medals', name: 'Bosnia-Herzegovina Mission Insignia (SHQSU)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/CHE_Operations_abroad_Bosnia-Herzegovina_%28SHQSU%29.png/250px-CHE_Operations_abroad_Bosnia-Herzegovina_%28SHQSU%29.png' },
  { country: 'Switzerland', branch: 'Switzerland Campaign Medals', name: 'Korea Mission Insignia (NNSC)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/CHE_Operations_abroad_Korea_%28NNSC%29.png/250px-CHE_Operations_abroad_Korea_%28NNSC%29.png' },
  { country: 'Switzerland', branch: 'Switzerland Campaign Medals', name: 'Namibia Mission Insignia (UNTAG)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/CHE_Operations_abroad_Namibia_%28GANUPT%29.png/250px-CHE_Operations_abroad_Namibia_%28GANUPT%29.png' },
  { country: 'Switzerland', branch: 'Switzerland Campaign Medals', name: 'Western Sahara Mission Insignia (MINURSO)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/CHE_Operations_abroad_Western_Sahara_%28MINURSO%29.png/250px-CHE_Operations_abroad_Western_Sahara_%28MINURSO%29.png' },
  { country: 'Switzerland', branch: 'Switzerland Campaign Medals', name: 'Peace Support Mission Insignia', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/CHE_Operations_abroad_Peace_Support.png/250px-CHE_Operations_abroad_Peace_Support.png' },
  { country: 'Switzerland', branch: 'Switzerland Campaign Medals', name: 'UN Military Observer Mission Insignia', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/CHE_Operations_abroad_UN_Military_Observer.png/250px-CHE_Operations_abroad_UN_Military_Observer.png' },
  { country: 'Switzerland', branch: 'Switzerland Campaign Medals', name: 'Partnership for Peace Mission Insignia', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/CHE_Partnership_for_Peace_Mission_Insignia.png/250px-CHE_Partnership_for_Peace_Mission_Insignia.png' },
  { country: 'Switzerland', branch: 'Switzerland Campaign Medals', name: 'Long Leave for Military Duties Abroad (LAK)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/CHE_Long_leave_for_military_duties_abroad.png/250px-CHE_Long_leave_for_military_duties_abroad.png' },
  { country: 'Switzerland', branch: 'Switzerland Campaign Medals', name: 'UN/OSCE/NATO Mandate Mission Badge', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/CHE_UNO_OSZE_Mandate.png/250px-CHE_UNO_OSZE_Mandate.png' },

  // ─── GERMANY (NVA) ──────────────────────────────────────────────────────────
  // Orders & Distinguished Service
  { country: 'Germany (NVA)', branch: 'Germany (NVA) Orders & Distinguished Service', name: 'Militarischer Verdienstorden - Gold (Order of Military Merit - Gold)', url: 'https://www.medals.pl/de/r/drmvo1.gif' },
  { country: 'Germany (NVA)', branch: 'Germany (NVA) Orders & Distinguished Service', name: 'Militarischer Verdienstorden - Silver (Order of Military Merit - Silver)', url: 'https://www.medals.pl/de/r/drmvo2.gif' },
  { country: 'Germany (NVA)', branch: 'Germany (NVA) Orders & Distinguished Service', name: 'Militarischer Verdienstorden - Bronze (Order of Military Merit - Bronze)', url: 'https://www.medals.pl/de/r/drmvo3.gif' },
  { country: 'Germany (NVA)', branch: 'Germany (NVA) Orders & Distinguished Service', name: 'Militarische Verdienstmedaille (Medal of Military Merit)', url: 'https://www.medals.pl/de/r/drmvm.gif' },
  // Long Service
  { country: 'Germany (NVA)', branch: 'Germany (NVA) Long Service', name: 'Ehrenzeichen fur Verdienste in der Reservistenarbeit - Gold (Reserve Service Medal - Gold)', url: 'https://www.medals.pl/de/r/drmvres1.gif' },
  { country: 'Germany (NVA)', branch: 'Germany (NVA) Long Service', name: 'Ehrenzeichen fur Verdienste in der Reservistenarbeit - Silver (Reserve Service Medal - Silver)', url: 'https://www.medals.pl/de/r/drmvres2.gif' },
  { country: 'Germany (NVA)', branch: 'Germany (NVA) Long Service', name: 'Ehrenzeichen fur Verdienste in der Reservistenarbeit - Bronze (Reserve Service Medal - Bronze)', url: 'https://www.medals.pl/de/r/drmvres3.gif' },
  // Commemorative
  { country: 'Germany (NVA)', branch: 'Germany (NVA) Commemorative', name: 'Ehrenmedaille 30 Jahre Nationale Volksarmee (30th Anniversary of NVA Medal)', url: 'https://www.medals.pl/de/r/drmnva30.gif' },

  // ─── POLAND ─────────────────────────────────────────────────────────────────
  // Orders
  { country: 'Poland', branch: 'Poland Orders', name: 'Order of the White Eagle', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/POL_Order_Or%C5%82a_Bia%C5%82ego_BAR.svg/250px-POL_Order_Or%C5%82a_Bia%C5%82ego_BAR.svg.png' },
  // Order Virtuti Militari - 5 grades
  { country: 'Poland', branch: 'Poland Orders', name: 'Order Virtuti Militari - Grand Cross', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/POL_Virtuti_Militari_Wielki_BAR.svg/250px-POL_Virtuti_Militari_Wielki_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Orders', name: 'Order Virtuti Militari - Commander', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/POL_Virtuti_Militari_Komandorski_BAR.svg/250px-POL_Virtuti_Militari_Komandorski_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Orders', name: 'Order Virtuti Militari - Gold Cross', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/POL_Virtuti_Militari_Z%C5%82oty_BAR.svg/250px-POL_Virtuti_Militari_Z%C5%82oty_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Orders', name: 'Order Virtuti Militari - Silver Cross', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/POL_Virtuti_Militari_Srebrny_BAR.svg/250px-POL_Virtuti_Militari_Srebrny_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Orders', name: 'Order Virtuti Militari - Knight', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/POL_Virtuti_Militari_Kawalerski_BAR.svg/250px-POL_Virtuti_Militari_Kawalerski_BAR.svg.png' },
  // Order of the Military Cross (Krzyz Wojskowy) - established 2014
  { country: 'Poland', branch: 'Poland Orders', name: 'Order of the Military Cross - Grand Cross', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/POL_Order_Krzy%C5%BCa_Wojskowego_Wielki_BAR.svg/250px-POL_Order_Krzy%C5%BCa_Wojskowego_Wielki_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Orders', name: 'Order of the Military Cross - Commander', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/POL_Order_Krzy%C5%BCa_Wojskowego_Komandorski_BAR.svg/250px-POL_Order_Krzy%C5%BCa_Wojskowego_Komandorski_BAR.svg.png' },
  // Order Polonia Restituta - 5 grades
  { country: 'Poland', branch: 'Poland Orders', name: 'Order Polonia Restituta - Grand Cross', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/POL_Polonia_Restituta_Wielki_BAR.svg/250px-POL_Polonia_Restituta_Wielki_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Orders', name: 'Order Polonia Restituta - Commander with Star', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/POL_Polonia_Restituta_Komandorski_ZG_BAR.svg/250px-POL_Polonia_Restituta_Komandorski_ZG_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Orders', name: 'Order Polonia Restituta - Commander', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/POL_Polonia_Restituta_Komandorski_BAR.svg/250px-POL_Polonia_Restituta_Komandorski_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Orders', name: 'Order Polonia Restituta - Officer', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/POL_Polonia_Restituta_Oficerski_BAR.svg/250px-POL_Polonia_Restituta_Oficerski_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Orders', name: 'Order Polonia Restituta - Knight', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/POL_Polonia_Restituta_Kawalerski_BAR.svg/250px-POL_Polonia_Restituta_Kawalerski_BAR.svg.png' },
  // Order of Merit of the Republic of Poland - 5 grades
  { country: 'Poland', branch: 'Poland Orders', name: 'Order of Merit of the Republic of Poland - 1st Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/POL_Order_Zaslugi_RP_kl1_BAR.svg/250px-POL_Order_Zaslugi_RP_kl1_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Orders', name: 'Order of Merit of the Republic of Poland - 2nd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/POL_Order_Zaslugi_RP_kl2_BAR.svg/250px-POL_Order_Zaslugi_RP_kl2_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Orders', name: 'Order of Merit of the Republic of Poland - 3rd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/POL_Order_Zaslugi_RP_kl3_BAR.svg/250px-POL_Order_Zaslugi_RP_kl3_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Orders', name: 'Order of Merit of the Republic of Poland - 4th Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/POL_Order_Zaslugi_RP_kl4_BAR.svg/250px-POL_Order_Zaslugi_RP_kl4_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Orders', name: 'Order of Merit of the Republic of Poland - 5th Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/POL_Order_Zaslugi_RP_kl5_BAR.svg/250px-POL_Order_Zaslugi_RP_kl5_BAR.svg.png' },
  // Gallantry & Crosses
  // Cross of Valour - up to 4 awards
  { country: 'Poland', branch: 'Poland Gallantry & Crosses', name: 'Cross of Valour', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/POL_Krzy%C5%BC_Walecznych_BAR.svg/250px-POL_Krzy%C5%BC_Walecznych_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Gallantry & Crosses', name: 'Cross of Valour - 2nd Award', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/POL_Krzy%C5%BC_Walecznych_2r_BAR.svg/250px-POL_Krzy%C5%BC_Walecznych_2r_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Gallantry & Crosses', name: 'Cross of Valour - 3rd Award', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/POL_Krzy%C5%BC_Walecznych_3r_BAR.svg/250px-POL_Krzy%C5%BC_Walecznych_3r_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Gallantry & Crosses', name: 'Cross of Valour - 4th Award', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/POL_Krzy%C5%BC_Walecznych_4r_BAR.svg/250px-POL_Krzy%C5%BC_Walecznych_4r_BAR.svg.png' },
  // Military Cross (Krzyz Wojskowy - cross, not the Order)
  { country: 'Poland', branch: 'Poland Gallantry & Crosses', name: 'Military Cross', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/POL_Krzy%C5%BC_Wojskowy_BAR.svg/250px-POL_Krzy%C5%BC_Wojskowy_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Gallantry & Crosses', name: 'Military Cross - 2nd Award', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/POL_Krzy%C5%BC_Wojskowy_2r_BAR.svg/250px-POL_Krzy%C5%BC_Wojskowy_2r_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Gallantry & Crosses', name: 'Military Cross - 3rd Award', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/POL_Krzy%C5%BC_Wojskowy_3r_BAR.svg/250px-POL_Krzy%C5%BC_Wojskowy_3r_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Gallantry & Crosses', name: 'Military Cross - 4th Award', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/POL_Krzy%C5%BC_Wojskowy_4r_BAR.svg/250px-POL_Krzy%C5%BC_Wojskowy_4r_BAR.svg.png' },
  // Cross of Merit for Bravery
  { country: 'Poland', branch: 'Poland Gallantry & Crosses', name: 'Cross of Merit for Bravery', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/POL_Krzy%C5%BC_Zas%C5%82ugi_za_Dzielno%C5%9B%C4%87_BAR.svg/250px-POL_Krzy%C5%BC_Zas%C5%82ugi_za_Dzielno%C5%9B%C4%87_BAR.svg.png' },
  // Cross of Merit with Swords (Army, Air Force, Navy)
  { country: 'Poland', branch: 'Poland Gallantry & Crosses', name: 'Army Cross of Merit with Swords', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/POL_Wojskowy_Krzy%C5%BC_Zas%C5%82ugi_z_Mieczami_BAR.svg/250px-POL_Wojskowy_Krzy%C5%BC_Zas%C5%82ugi_z_Mieczami_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Gallantry & Crosses', name: 'Army Cross of Merit with Swords - 2nd Award', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/POL_Wojskowy_Krzy%C5%BC_Zas%C5%82ugi_z_Mieczami_2r_BAR.svg/250px-POL_Wojskowy_Krzy%C5%BC_Zas%C5%82ugi_z_Mieczami_2r_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Gallantry & Crosses', name: 'Air Force Cross of Merit with Swords', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/POL_Lotniczy_Krzy%C5%BC_Zas%C5%82ugi_z_Mieczami_BAR.svg/250px-POL_Lotniczy_Krzy%C5%BC_Zas%C5%82ugi_z_Mieczami_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Gallantry & Crosses', name: 'Air Force Cross of Merit with Swords - 2nd Award', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/POL_Lotniczy_Krzy%C5%BC_Zas%C5%82ugi_z_Mieczami_2r_BAR.svg/250px-POL_Lotniczy_Krzy%C5%BC_Zas%C5%82ugi_z_Mieczami_2r_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Gallantry & Crosses', name: 'Navy Cross of Merit with Swords', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/POL_Morski_Krzy%C5%BC_Zas%C5%82ugi_z_Mieczami_BAR.svg/250px-POL_Morski_Krzy%C5%BC_Zas%C5%82ugi_z_Mieczami_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Gallantry & Crosses', name: 'Navy Cross of Merit with Swords - 2nd Award', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/POL_Morski_Krzy%C5%BC_Zas%C5%82ugi_z_Mieczami_2r_BAR.svg/250px-POL_Morski_Krzy%C5%BC_Zas%C5%82ugi_z_Mieczami_2r_BAR.svg.png' },

  // Cross of Merit with Swords - Gold/Silver/Bronze (state awards)
  { country: 'Poland', branch: 'Poland Gallantry & Crosses', name: 'Gold Cross of Merit with Swords', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/POL_Z%C5%82oty_Krzy%C5%BC_Zas%C5%82ugi_z_Mieczami_BAR.svg/250px-POL_Z%C5%82oty_Krzy%C5%BC_Zas%C5%82ugi_z_Mieczami_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Gallantry & Crosses', name: 'Silver Cross of Merit with Swords', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/POL_Srebrny_Krzy%C5%BC_Zas%C5%82ugi_z_Mieczami_BAR.svg/250px-POL_Srebrny_Krzy%C5%BC_Zas%C5%82ugi_z_Mieczami_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Gallantry & Crosses', name: 'Bronze Cross of Merit with Swords', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/POL_Br%C4%85zowy_Krzy%C5%BC_Zas%C5%82ugi_z_Mieczami_BAR.svg/250px-POL_Br%C4%85zowy_Krzy%C5%BC_Zas%C5%82ugi_z_Mieczami_BAR.svg.png' },
  // Military/Air/Navy Cross of Merit (without swords - non-combat service merit)
  { country: 'Poland', branch: 'Poland Gallantry & Crosses', name: 'Military Cross of Merit', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/POL_Wojskowy_Krzy%C5%BC_Zas%C5%82ugi_BAR.svg/250px-POL_Wojskowy_Krzy%C5%BC_Zas%C5%82ugi_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Gallantry & Crosses', name: 'Military Cross of Merit - 2nd Award', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/POL_Wojskowy_Krzy%C5%BC_Zas%C5%82ugi_2r_BAR.svg/250px-POL_Wojskowy_Krzy%C5%BC_Zas%C5%82ugi_2r_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Gallantry & Crosses', name: 'Air Force Cross of Merit', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/POL_Lotniczy_Krzy%C5%BC_Zas%C5%82ugi_BAR.svg/250px-POL_Lotniczy_Krzy%C5%BC_Zas%C5%82ugi_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Gallantry & Crosses', name: 'Navy Cross of Merit', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/POL_Morski_Krzy%C5%BC_Zas%C5%82ugi_BAR.svg/250px-POL_Morski_Krzy%C5%BC_Zas%C5%82ugi_BAR.svg.png' },
  // Medal for Sacrifice and Courage (Odznaka za Rany i Kontuzje - wound/courage medal)
  { country: 'Poland', branch: 'Poland Gallantry & Crosses', name: 'Medal for Sacrifice and Courage', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/POL_Medal_za_Ofiarno%C5%9B%C4%87_i_Odwag%C4%99_BAR.svg/250px-POL_Medal_za_Ofiarno%C5%9B%C4%87_i_Odwag%C4%99_BAR.svg.png' },  // Service Medals (Army/Air/Navy merit medals, multi-award)
  // Medal Wojska (Army Service Medal)
  { country: 'Poland', branch: 'Poland Service Medals', name: 'Army Medal - Gold', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/POL_Z%C5%82oty_Medal_Wojska_Polskiego_BAR.svg/250px-POL_Z%C5%82oty_Medal_Wojska_Polskiego_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Service Medals', name: 'Army Medal - Silver', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/POL_Srebrny_Medal_Wojska_Polskiego_BAR.svg/250px-POL_Srebrny_Medal_Wojska_Polskiego_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Service Medals', name: 'Army Medal - Bronze', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/POL_Br%C4%85zowy_Medal_Wojska_Polskiego_BAR.svg/250px-POL_Br%C4%85zowy_Medal_Wojska_Polskiego_BAR.svg.png' },
  // Medal Wojska (multi-award service medal)
  { country: 'Poland', branch: 'Poland Service Medals', name: 'Medal of the Armed Forces', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/POL_Medal_Wojska_BAR.svg/250px-POL_Medal_Wojska_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Service Medals', name: 'Medal of the Armed Forces - 2nd Award', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/POL_Medal_Wojska_2r_BAR.svg/250px-POL_Medal_Wojska_2r_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Service Medals', name: 'Medal of the Armed Forces - 3rd Award', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/POL_Medal_Wojska_3r_BAR.svg/250px-POL_Medal_Wojska_3r_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Service Medals', name: 'Medal of the Armed Forces - 4th Award', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/POL_Medal_Wojska_4r_BAR.svg/250px-POL_Medal_Wojska_4r_BAR.svg.png' },
  // Medal Lotniczy (Air Force Medal)
  { country: 'Poland', branch: 'Poland Service Medals', name: 'Air Force Medal', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/POL_Medal_Lotniczy_BAR.svg/250px-POL_Medal_Lotniczy_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Service Medals', name: 'Air Force Medal - 2nd Award', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/POL_Medal_Lotniczy_2r_BAR.svg/250px-POL_Medal_Lotniczy_2r_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Service Medals', name: 'Air Force Medal - 3rd Award', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/POL_Medal_Lotniczy_3r_BAR.svg/250px-POL_Medal_Lotniczy_3r_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Service Medals', name: 'Air Force Medal - 4th Award', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/POL_Medal_Lotniczy_4r_BAR.svg/250px-POL_Medal_Lotniczy_4r_BAR.svg.png' },
  // Medal Morski (Navy Medal)
  { country: 'Poland', branch: 'Poland Service Medals', name: 'Navy Medal', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/POL_Medal_Morski_BAR.svg/250px-POL_Medal_Morski_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Service Medals', name: 'Navy Medal - 1st Oak Leaf', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/POL_Medal_Morski_1ok_BAR.svg/250px-POL_Medal_Morski_1ok_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Service Medals', name: 'Navy Medal - 2nd Oak Leaf', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/POL_Medal_Morski_2ok_BAR.svg/250px-POL_Medal_Morski_2ok_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Service Medals', name: 'Navy Medal - 3rd Oak Leaf', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/POL_Medal_Morski_3ok_BAR.svg/250px-POL_Medal_Morski_3ok_BAR.svg.png' },
  // Medal Gloria Intrepidis (for distinguished acts in military operations)
  { country: 'Poland', branch: 'Poland Service Medals', name: 'Medal Gloria Intrepidis et Animi Promptis', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/POL_Medal_Gloria_Intrepidis_et_Animi_Promptis_BAR.svg/250px-POL_Medal_Gloria_Intrepidis_et_Animi_Promptis_BAR.svg.png' },
  // Campaign Medals - Afghanistan (PKW RS rotations)
  { country: 'Poland', branch: 'Poland Campaign Medals', name: 'PKW Afghanistan Commemorative Medal (10th rotation)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/POL_Medal_Pam_Xzm_PKW_Afganistan_RS_BAR.svg/250px-POL_Medal_Pam_Xzm_PKW_Afganistan_RS_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Campaign Medals', name: 'PKW Afghanistan Commemorative Medal (11th rotation)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/POL_Medal_Pam_XIzm_PKW_Afganistan_RS_BAR.svg/250px-POL_Medal_Pam_XIzm_PKW_Afganistan_RS_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Campaign Medals', name: 'PKW Afghanistan Commemorative Medal (12th rotation)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/POL_Medal_Pam_XIIzm_PKW_Afganistan_RS_BAR.svg/250px-POL_Medal_Pam_XIIzm_PKW_Afganistan_RS_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Campaign Medals', name: 'PKW Afghanistan Commemorative Medal (13th rotation)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/POL_Medal_Pam_XIIIzm_PKW_Afganistan_RS_BAR.svg/250px-POL_Medal_Pam_XIIIzm_PKW_Afganistan_RS_BAR.svg.png' },
  // Campaign Medals - Iraq
  { country: 'Poland', branch: 'Poland Campaign Medals', name: 'PKW Iraq Commemorative Medal (NMI)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/POL_Medal_Pam_PKW_Irak_NMI_BAR.svg/250px-POL_Medal_Pam_PKW_Irak_NMI_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Campaign Medals', name: 'PKW Iraq Commemorative Medal (12th rotation, 2022)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/POL_Medal_Pam_PKW_Irak_XIIzm_%282022%29_BAR.svg/250px-POL_Medal_Pam_PKW_Irak_XIIzm_%282022%29_BAR.svg.png' },
  // Campaign Medals - KFOR (Kosovo)
  { country: 'Poland', branch: 'Poland Campaign Medals', name: 'PKW KFOR Commemorative Badge (generic)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/POL_Odznaka_pam_PKW_KFOR_BAR.svg/250px-POL_Odznaka_pam_PKW_KFOR_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Campaign Medals', name: 'PKW KFOR Commemorative Badge (35th rotation)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/POL_Odznaka_pam_XXXVzm_PKW_KFOR_BAR.svg/250px-POL_Odznaka_pam_XXXVzm_PKW_KFOR_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Campaign Medals', name: 'PKW KFOR Commemorative Badge (36th rotation)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/POL_Odznaka_pam_XXXVIzm_PKW_KFOR_BAR.svg/250px-POL_Odznaka_pam_XXXVIzm_PKW_KFOR_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Campaign Medals', name: 'PKW KFOR Commemorative Badge (37th rotation)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/POL_Odznaka_pam_XXXVIIzm_PKW_KFOR_BAR.svg/250px-POL_Odznaka_pam_XXXVIIzm_PKW_KFOR_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Campaign Medals', name: 'PKW KFOR Commemorative Badge (39th rotation)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/POL_Odznaka_pam_XXXIXzm_PKW_KFOR_BAR.svg/250px-POL_Odznaka_pam_XXXIXzm_PKW_KFOR_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Campaign Medals', name: 'PKW KFOR Commemorative Badge (41st rotation)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/POL_Odznaka_pam_XLIzm_PKW_KFOR_BAR.svg/250px-POL_Odznaka_pam_XLIzm_PKW_KFOR_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Campaign Medals', name: 'PKW KFOR Commemorative Badge (42nd rotation)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/POL_Odznaka_pam_XLIIzm_PKW_KFOR_BAR.svg/250px-POL_Odznaka_pam_XLIIzm_PKW_KFOR_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Campaign Medals', name: 'PKW KFOR Commemorative Badge (43rd rotation)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/POL_Odznaka_pam_XLIIIzm_PKW_KFOR_BAR.svg/250px-POL_Odznaka_pam_XLIIIzm_PKW_KFOR_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Campaign Medals', name: 'PKW KFOR Commemorative Badge (46th rotation)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/POL_Odznaka_pam_XLVIzm_PKW_KFOR_BAR.svg/250px-POL_Odznaka_pam_XLVIzm_PKW_KFOR_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Campaign Medals', name: 'PKW KFOR Commemorative Badge (47th rotation)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/POL_Odznaka_pam_XLVIIzm_PKW_KFOR_BAR.svg/250px-POL_Odznaka_pam_XLVIIzm_PKW_KFOR_BAR.svg.png' },
  // Campaign Medals - EUFOR Althea (Bosnia)
  { country: 'Poland', branch: 'Poland Campaign Medals', name: 'PKW EUFOR Althea Commemorative Medal (16th rotation)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/POL_Medal_Pam_XVIzm_PKW_EUFOR_Althea_BAR.svg/250px-POL_Medal_Pam_XVIzm_PKW_EUFOR_Althea_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Campaign Medals', name: 'PKW EUFOR Althea Commemorative Medal (19th-23rd rotation)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/POL_Medal_Pam_XIXzm_XXIIIzm_PKW_EUFOR_Althea_BAR.svg/250px-POL_Medal_Pam_XIXzm_XXIIIzm_PKW_EUFOR_Althea_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Campaign Medals', name: 'PKW EUFOR Althea Commemorative Medal (25th rotation)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/POL_Medal_Pam_XXVzm_PKW_EUFOR_Althea_BAR.svg/250px-POL_Medal_Pam_XXVzm_PKW_EUFOR_Althea_BAR.svg.png' },
  { country: 'Poland', branch: 'Poland Campaign Medals', name: 'PKW EUFOR Althea Commemorative Medal (27th rotation)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/POL_Medal_Pam_XXVIIzm_PKW_EUFOR_Althea_BAR.svg/250px-POL_Medal_Pam_XXVIIzm_PKW_EUFOR_Althea_BAR.svg.png' },
  // Campaign Medals - Lebanon
  { country: 'Poland', branch: 'Poland Campaign Medals', name: 'PKW Lebanon Commemorative Medal (2023)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/POL_Medal_Pam_PKW_Liban_%282023%29_BAR.svg/250px-POL_Medal_Pam_PKW_Liban_%282023%29_BAR.svg.png' },
  // Commemorative
  { country: 'Poland', branch: 'Poland Commemorative', name: 'Medal of the Centenary of Regained Independence', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/POL_Medal_Stulecia_Odzyskanej_Niepodl_BAR.svg/250px-POL_Medal_Stulecia_Odzyskanej_Niepodl_BAR.svg.png' },

  // ─── LUXEMBOURG ─────────────────────────────────────────────────────────────
  { country: 'Luxembourg', branch: 'Luxembourg Orders', name: 'Order of Adolph of Nassau', url: 'https://www.medals.pl/lu/r/lu1oan.gif' },
  { country: 'Luxembourg', branch: 'Luxembourg Gallantry & Crosses', name: 'Croix de Guerre', url: 'https://www.medals.pl/lu/r/lu1cg.gif' },

  // United States
  { country: 'United States', branch: 'US Gallantry', name: 'Medal of Honor Ribbon', url: 'https://www.uniformribbons.com/image/medal_of_honor_ribbon.png' },
  { country: 'United States', branch: 'US Gallantry', name: 'Army Distinguished Service Cross Ribbon', url: 'https://www.uniformribbons.com/image/army_distinguished_service_cross_ribbon.png' },
  { country: 'United States', branch: 'US Orders & Distinguished Service', name: 'Defense Distinguished Service Ribbon', url: 'https://www.uniformribbons.com/image/defense_distinguished_service_ribbon.png' },
  { country: 'United States', branch: 'US Orders & Distinguished Service', name: 'Army Distinguished Service Ribbon', url: 'https://www.uniformribbons.com/image/army_distinguished_service_ribbon.png' },
  { country: 'United States', branch: 'US Gallantry', name: 'Silver Star Ribbon', url: 'https://www.uniformribbons.com/image/silver_star_ribbon.png' },
  { country: 'United States', branch: 'US Orders & Distinguished Service', name: 'Defense Superior Service Ribbon', url: 'https://www.uniformribbons.com/image/defense_superior_service_ribbon.png' },
  { country: 'United States', branch: 'US Orders & Distinguished Service', name: 'Legion of Merit Ribbon', url: 'https://www.uniformribbons.com/image/legion_of_merit_ribbon.png' },
  { country: 'United States', branch: 'US Gallantry', name: 'Distinguished Flying Cross Ribbon', url: 'https://www.uniformribbons.com/image/distinguished_flying_cross_ribbon.png' },
  { country: 'United States', branch: 'US Gallantry', name: 'Soldier\'s Medal Ribbon', url: 'https://www.uniformribbons.com/image/soldier_medal_ribbon.png' },
  { country: 'United States', branch: 'US Gallantry', name: 'Bronze Star Ribbon', url: 'https://www.uniformribbons.com/image/bronze_star_ribbon.png' },
  { country: 'United States', branch: 'US Gallantry', name: 'Purple Heart Ribbon', url: 'https://www.uniformribbons.com/image/purple_heart_ribbon.png' },
  { country: 'United States', branch: 'US Orders & Distinguished Service', name: 'Defense Meritorious Service Ribbon', url: 'https://www.uniformribbons.com/image/defense_meritorious_service_ribbon.png' },
  { country: 'United States', branch: 'US Orders & Distinguished Service', name: 'Meritorious Service Ribbon', url: 'https://www.uniformribbons.com/image/meritorious_service_ribbon.png' },
  { country: 'United States', branch: 'US Gallantry', name: 'Air Medal Ribbon', url: 'https://www.uniformribbons.com/image/air_medal_ribbon.png' },
  { country: 'United States', branch: 'US Commendations', name: 'Joint Service Commendation Ribbon', url: 'https://www.uniformribbons.com/image/joint_service_commendation_ribbon.png' },
  { country: 'United States', branch: 'US Commendations', name: 'Army Commendation Ribbon', url: 'https://www.uniformribbons.com/image/army_commendation_ribbon.png' },
  { country: 'United States', branch: 'US Commendations', name: 'Joint Service Achievement Ribbon', url: 'https://www.uniformribbons.com/image/joint_service_achievement_ribbon.png' },
  { country: 'United States', branch: 'US Commendations', name: 'Army Achievement Ribbon', url: 'https://www.uniformribbons.com/image/army_achievement_ribbon.png' },
  { country: 'United States', branch: 'US Commendations', name: 'Army Presidential Unit Citation Ribbon', url: 'https://www.uniformribbons.com/image/army_presidential_unit_citation_ribbon.png' },
  { country: 'United States', branch: 'US Commendations', name: 'Joint Service Meritorious Unit Ribbon', url: 'https://www.uniformribbons.com/image/joint_service_meritorious_unit_ribbon.png' },
  { country: 'United States', branch: 'US Commendations', name: 'Army Valorous Unit Award Ribbon', url: 'https://www.uniformribbons.com/image/army_valorous_unit_award_ribbon.png' },
  { country: 'United States', branch: 'US Commendations', name: 'Army Meritorious Unit Commendation Ribbon', url: 'https://www.uniformribbons.com/image/army_meritorious_unit_commendation_ribbon.png' },
  { country: 'United States', branch: 'US Commendations', name: 'Army Superior Unit Award Ribbon', url: 'https://www.uniformribbons.com/image/army_superior_unit_award_ribbon.png' },
  { country: 'United States', branch: 'US Commemorative', name: 'Prisoner of War Ribbon', url: 'https://www.uniformribbons.com/image/prisoner_of_war_ribbon.png' },
  { country: 'United States', branch: 'US Long Service', name: 'Army Good Conduct Ribbon', url: 'https://www.uniformribbons.com/image/army_good_conduct_ribbon.png' },
  { country: 'United States', branch: 'US Service Medals', name: 'Army Reserve Components Achievement Ribbon', url: 'https://www.uniformribbons.com/image/army_reserve_components_achievement_ribbon.png' },
  { country: 'United States', branch: 'US Service Medals', name: 'National Defense Service Medal Ribbon', url: 'https://www.uniformribbons.com/image/national_defense_service_medal_ribbon.png' },
  { country: 'United States', branch: 'US Service Medals', name: 'Antarctica Service Ribbon', url: 'https://www.uniformribbons.com/image/antarctica_service_ribbon.png' },
  { country: 'United States', branch: 'US Service Medals', name: 'Armed Forces Expeditionary Medal Ribbon', url: 'https://www.uniformribbons.com/image/armed_forces_expeditionary_ribbon.png' },
  { country: 'United States', branch: 'US Campaign Medals', name: 'Southwest Asia Service Medal Ribbon', url: 'https://www.uniformribbons.com/image/southwest_asia_service_ribbon.png' },
  { country: 'United States', branch: 'US Campaign Medals', name: 'Kosovo Campaign Medal Ribbon', url: 'https://www.uniformribbons.com/image/kosovo_campaign_ribbon.png' },
  { country: 'United States', branch: 'US Campaign Medals', name: 'Afghanistan Campaign Medal Ribbon', url: 'https://www.uniformribbons.com/image/afghanistan_campaign_ribbon.png' },
  { country: 'United States', branch: 'US Campaign Medals', name: 'Iraq Campaign Medal Ribbon', url: 'https://www.uniformribbons.com/image/iraq_campaign_ribbon.png' },
  { country: 'United States', branch: 'US Campaign Medals', name: 'Inherent Resolve Campaign Medal', url: 'https://www.uniformribbons.com/image/inherent_resolve_campaign_ribbon.png' },
  { country: 'United States', branch: 'US Campaign Medals', name: 'Global War on Terrorism Expeditionary Ribbon', url: 'https://www.uniformribbons.com/image/global_war_on_terrorism_expeditionary_ribbon.png' },
  { country: 'United States', branch: 'US Commemorative', name: 'Global War Terrorism Service Ribbon', url: 'https://www.uniformribbons.com/image/global_war_terrorism_service_ribbon.png' },
  { country: 'United States', branch: 'US Campaign Medals', name: 'Korea Defense Service Medal Ribbon', url: 'https://www.uniformribbons.com/image/korea_defense_service_ribbon.png' },
  { country: 'United States', branch: 'US Service Medals', name: 'Armed Forces Service Ribbon', url: 'https://www.uniformribbons.com/image/armed_forces_service_ribbon.png' },
  { country: 'United States', branch: 'US Service Medals', name: 'Humanitarian Service Medal Ribbon', url: 'https://www.uniformribbons.com/image/humanitarian_service_ribbon.png' },
  { country: 'United States', branch: 'US Commendations', name: 'Outstanding Volunteer Ribbon', url: 'https://www.uniformribbons.com/image/outstanding_volunteer_ribbon.png' },
  { country: 'United States', branch: 'US Service Medals', name: 'Army Sea Duty Ribbon', url: 'https://www.uniformribbons.com/image/army_sea_duty_ribbon.png' },
  { country: 'United States', branch: 'US Service Medals', name: 'Armed Forces Reserve Ribbon', url: 'https://www.uniformribbons.com/image/armed_forces_reserve_ribbon.png' },
  { country: 'United States', branch: 'US Long Service', name: 'NCO Professional Development Ribbon', url: 'https://www.uniformribbons.com/image/nco_professional_development_ribbon.png' },
  { country: 'United States', branch: 'US Service Medals', name: 'Army Service Ribbon', url: 'https://www.uniformribbons.com/image/army_service_ribbon.png' },
  { country: 'United States', branch: 'US Service Medals', name: 'Arctic Service Ribbon', url: 'https://www.uniformribbons.com/image/army_arctic_service_ribbon.png' },
  { country: 'United States', branch: 'US Service Medals', name: 'Army Overseas Service Ribbon', url: 'https://www.uniformribbons.com/image/army_overseas_service_ribbon.png' },
  { country: 'United States', branch: 'US Service Medals', name: 'Army Reserve Componenets Overseas Training', url: 'https://www.uniformribbons.com/image/army_reserve_components_overseas_training_ribbon.png' },
  { country: 'United States', branch: 'US Campaign Medals', name: 'Kuwait Liberation Saudi Arabia Ribbon', url: 'https://www.uniformribbons.com/image/kuwait_liberation_saudi_arabia_ribbon.png' },
  { country: 'United States', branch: 'US Campaign Medals', name: 'Kuwait Liberation Kuwait Ribbon', url: 'https://www.uniformribbons.com/image/kuwait_liberation_kuwait_ribbon.png' },
  { country: 'United States', branch: 'US Campaign Medals', name: 'Kuwait Liberation Medal (Saudi Arabia) Ribbon', url: 'https://www.uniformribbons.com/image/kuwait_liberation_saudi_arabia_ribbon.png' },
  { country: 'United States', branch: 'US Campaign Medals', name: 'Kuwait Liberation Medal (Kuwait) Ribbon', url: 'https://www.uniformribbons.com/image/kuwait_liberation_kuwait_ribbon.png' },
  { country: 'United States', branch: 'US Gallantry', name: 'Navy Cross Ribbon', url: 'https://www.uniformribbons.com/image/navy_cross_ribbon.png' },
  { country: 'United States', branch: 'US Orders & Distinguished Service', name: 'Navy Distinguished Service Ribbon', url: 'https://www.uniformribbons.com/image/navy_distinguished_service_ribbon.png' },
  { country: 'United States', branch: 'US Long Service', name: 'Navy Marine Corps Ribbon', url: 'https://www.uniformribbons.com/image/navy_marine_corps_ribbon.png' },
  { country: 'United States', branch: 'US Commendations', name: 'Navy Marine Corps Commendation Ribbon', url: 'https://www.uniformribbons.com/image/navy_marine_corps_commendation_ribbon.png' },
  { country: 'United States', branch: 'US Commendations', name: 'Navy Marine Corps Achievement Ribbon', url: 'https://www.uniformribbons.com/image/navy_marine_corps_achievement_ribbon.png' },
  { country: 'United States', branch: 'US Gallantry', name: 'Navy Marine Corps Combat Action Ribbon', url: 'https://www.uniformribbons.com/image/navy_marine_corps_combat_action_ribbon.png' },
  { country: 'United States', branch: 'US Commendations', name: 'Navy Marine Corps Presidential Unit Citation Ribbon', url: 'https://www.uniformribbons.com/image/navy_marine_corps_presidential_unit_citation_ribbon.png' },
  { country: 'United States', branch: 'US Commendations', name: 'Navy Unit Commendation Ribbon', url: 'https://www.uniformribbons.com/image/navy_unit_commendation_ribbon.png' },
  { country: 'United States', branch: 'US Commendations', name: 'Navy Meritorious Unit Commendation Ribbon', url: 'https://www.uniformribbons.com/image/navy_marine_corps_meritorious_unit_commendation_ribbon.png' },
  { country: 'United States', branch: 'US Long Service', name: 'Navy E Ribbon', url: 'https://www.uniformribbons.com/image/navy_e_ribbon.png' },
  { country: 'United States', branch: 'US Long Service', name: 'Navy Good Conduct Ribbon', url: 'https://www.uniformribbons.com/image/navy_good_conduct_ribbon.png' },
  { country: 'United States', branch: 'US Orders & Distinguished Service', name: 'Naval Reserve Meritorious Service Ribbon', url: 'https://www.uniformribbons.com/image/naval_reserve_meritorious_service_ribbon.png' },
  { country: 'United States', branch: 'US Service Medals', name: 'Navy Fleet Marine Force Ribbon', url: 'https://www.uniformribbons.com/image/navy_fleet_marine_force_ribbon.png' },
  { country: 'United States', branch: 'US Service Medals', name: 'Navy Expeditionary Ribbon', url: 'https://www.uniformribbons.com/image/navy_expeditionary_ribbon.png' },
  { country: 'United States', branch: 'US Service Medals', name: 'National Defense Service Ribbon', url: 'https://www.uniformribbons.com/image/national_defense_service_medal_ribbon.png' },
  { country: 'United States', branch: 'US Service Medals', name: 'Armed Forces Expeditionary Ribbon', url: 'https://www.uniformribbons.com/image/armed_forces_expeditionary_ribbon.png' },
  { country: 'United States', branch: 'US Campaign Medals', name: 'Southwest Asia Service Ribbon', url: 'https://www.uniformribbons.com/image/southwest_asia_service_ribbon.png' },
  { country: 'United States', branch: 'US Campaign Medals', name: 'Kosovo Campaign Ribbon', url: 'https://www.uniformribbons.com/image/kosovo_campaign_ribbon.png' },
  { country: 'United States', branch: 'US Campaign Medals', name: 'Afghanistan Campaign Ribbon', url: 'https://www.uniformribbons.com/image/afghanistan_campaign_ribbon.png' },
  { country: 'United States', branch: 'US Campaign Medals', name: 'Iraq Campaign Ribbon', url: 'https://www.uniformribbons.com/image/iraq_campaign_ribbon.png' },
  { country: 'United States', branch: 'US Campaign Medals', name: 'Korea Defense Service Ribbon', url: 'https://www.uniformribbons.com/image/korea_defense_service_ribbon.png' },
  { country: 'United States', branch: 'US Service Medals', name: 'Humanitarian Service Ribbon', url: 'https://www.uniformribbons.com/image/humanitarian_service_ribbon.png' },
  { country: 'United States', branch: 'US Service Medals', name: 'Navy Sea Service Deployment Ribbon', url: 'https://www.uniformribbons.com/image/navy_sea_service_deployment_ribbon.png' },
  { country: 'United States', branch: 'US Service Medals', name: 'Navy Reserve Sea Service Ribbon', url: 'https://www.uniformribbons.com/image/navy_reserve_sea_service_ribbon.png' },
  { country: 'United States', branch: 'US Service Medals', name: 'Navy Marine Corps Overseas Service Ribbon', url: 'https://www.uniformribbons.com/image/navy_marine_corps_overseas_service_ribbon.png' },
  { country: 'United States', branch: 'US Long Service', name: 'Navy Recruiting Service Ribbon', url: 'https://www.uniformribbons.com/image/navy_recruiting_service_ribbon.png' },
  { country: 'United States', branch: 'US Long Service', name: 'Navy Recruit Training Service Ribbon', url: 'https://www.uniformribbons.com/image/navy_recruit_training_service_ribbon.png' },
  { country: 'United States', branch: 'US Long Service', name: 'Navy Ceremonial Guard Ribbon', url: 'https://www.uniformribbons.com/image/navy_ceremonial_guard_ribbon.png' },
  { country: 'United States', branch: 'US Long Service', name: 'Navy Recruit Honor Graduate Ribbon', url: 'https://www.uniformribbons.com/image/navy_recruit_honor_graduate_ribbon.png' },
  { country: 'United States', branch: 'US Service Medals', name: 'Navy Reserve Ribbon', url: 'https://www.uniformribbons.com/image/navy_reserve_ribbon.png' },
  { country: 'United States', branch: 'US Long Service', name: 'Navy Rifleman Ribbon', url: 'https://www.uniformribbons.com/image/navy_rifleman_ribbon.png' },
  { country: 'United States', branch: 'US Long Service', name: 'Navy Pistol Ribbon', url: 'https://www.uniformribbons.com/image/navy_pistol_ribbon.png' },
  { country: 'United States', branch: 'US Gallantry', name: 'Navy Marine Corps Medal Ribbon', url: 'https://www.uniformribbons.com/image/navy_marine_corps_ribbon.png' },
  { country: 'United States', branch: 'US Long Service', name: 'Marine Corps Good Conduct Ribbon', url: 'https://www.uniformribbons.com/image/marine_corps_good_conduct_ribbon.png' },
  { country: 'United States', branch: 'US Service Medals', name: 'Selected Marine Corps Reserve Ribbon', url: 'https://www.uniformribbons.com/image/selected_marine_corps_reserve_ribbon.png' },
  { country: 'United States', branch: 'US Service Medals', name: 'Marine Corps Expeditionary Ribbon', url: 'https://www.uniformribbons.com/image/marine_corps_expeditionary_ribbon.png' },
  { country: 'United States', branch: 'US Long Service', name: 'Marine Corps Recruiter Ribbon', url: 'https://www.uniformribbons.com/image/marine_corps_recruiting_ribbon.png' },
  { country: 'United States', branch: 'US Long Service', name: 'Marine Corps Drill Instructor Ribbon', url: 'https://www.uniformribbons.com/image/marine_corps_drill_instructor_ribbon.png' },
  { country: 'United States', branch: 'US Service Medals', name: 'Marine Corps Security Guard Ribbon', url: 'https://www.uniformribbons.com/image/marine_corps_security_guard_ribbon.png' },
  { country: 'United States', branch: 'US Long Service', name: 'Marine Corps Combat Instructor Ribbon', url: 'https://www.uniformribbons.com/image/marine_corps_combat_instructor_ribbon.png' },
  { country: 'United States', branch: 'US Long Service', name: 'Marine Corps Reserve Ribbon', url: 'https://www.uniformribbons.com/image/marine_corps_reserve_ribbon.png' },
  { country: 'United States', branch: 'US Campaign Medals', name: 'Kuwait Liberation Saudi Arabia', url: 'https://www.uniformribbons.com/image/kuwait_liberation_saudi_arabia_ribbon.png' },
  { country: 'United States', branch: 'US Gallantry', name: 'Air Force Cross Ribbon', url: 'https://www.uniformribbons.com/image/air_force_cross_ribbon.png' },
  { country: 'United States', branch: 'US Orders & Distinguished Service', name: 'Air Force Distinguished Service Ribbon', url: 'https://www.uniformribbons.com/image/air_force_distinguished_service_ribbon.png' },
  { country: 'United States', branch: 'US Long Service', name: 'Airman Ribbon', url: 'https://www.uniformribbons.com/image/airman_ribbon.png' },
  { country: 'United States', branch: 'US Long Service', name: 'Air Ribbon', url: 'https://www.uniformribbons.com/image/air_medal_ribbon.png' },
  { country: 'United States', branch: 'US Gallantry', name: 'Aerial Achievement Ribbon', url: 'https://www.uniformribbons.com/image/aerial_achievement_ribbon.png' },
  { country: 'United States', branch: 'US Commendations', name: 'Air Force Commendation Ribbon', url: 'https://www.uniformribbons.com/image/air_force_commendation_ribbon.png' },
  { country: 'United States', branch: 'US Commendations', name: 'Air Force Achievement Ribbon', url: 'https://www.uniformribbons.com/image/air_force_achievement_ribbon.png' },
  { country: 'United States', branch: 'US Gallantry', name: 'Air Force Combat Action Ribbon', url: 'https://www.uniformribbons.com/image/air_force_combat_action_ribbon.png' },
  { country: 'United States', branch: 'US Commendations', name: 'Air Force Presidential Unit Citation Ribbon', url: 'https://www.uniformribbons.com/image/air_force_presidential_unit_citation_ribbon.png' },
  { country: 'United States', branch: 'US Commendations', name: 'Joint Meritorious Unit Award Ribbon', url: 'https://www.uniformribbons.com/image/joint_service_meritorious_unit_ribbon.png' },
  { country: 'United States', branch: 'US Commendations', name: 'Air Force Gallant Unit Citation Ribbon', url: 'https://www.uniformribbons.com/image/air_force_gallant_unit_ribbon.png' },
  { country: 'United States', branch: 'US Commendations', name: 'Air Force Meritorious Unit Award Ribbon', url: 'https://www.uniformribbons.com/image/air_force_meritorious_unit_ribbon.png' },
  { country: 'United States', branch: 'US Commendations', name: 'Air Force Outstanding Unit Award Ribbon', url: 'https://www.uniformribbons.com/image/air_force_outstanding_unit_ribbon.png' },
  { country: 'United States', branch: 'US Commendations', name: 'Air Force Organizational Excellence Award Ribbon', url: 'https://www.uniformribbons.com/image/air_force_organizational_excellence_ribbon.png' },
  { country: 'United States', branch: 'US Long Service', name: 'Air Force Combat Readiness Ribbon', url: 'https://www.uniformribbons.com/image/air_force_combat_readiness_ribbon.png' },
  { country: 'United States', branch: 'US Long Service', name: 'Air Force Good Conduct Ribbon', url: 'https://www.uniformribbons.com/image/air_force_good_conduct_ribbon.png' },
  { country: 'United States', branch: 'US Orders & Distinguished Service', name: 'Air Reserve Meritorious Service Ribbon', url: 'https://www.uniformribbons.com/image/air_reserve_meritorious_service_ribbon.png' },
  { country: 'United States', branch: 'US Long Service', name: 'Outstanding Airman of the Year Ribbon', url: 'https://www.uniformribbons.com/image/outstanding_airman_of_the_year_ribbon.png' },
  { country: 'United States', branch: 'US Commendations', name: 'Air Force Recognition Ribbon', url: 'https://www.uniformribbons.com/image/air_force_recognition_ribbon.png' },
  { country: 'United States', branch: 'US Campaign Medals', name: 'Air and Space Campaign Ribbon', url: 'https://www.uniformribbons.com/image/air_and_space_campaign_ribbon.png' },
  { country: 'United States', branch: 'US Orders & Distinguished Service', name: 'Nuclear Deterrence Operations Service Medal', url: 'https://www.uniformribbons.com/image/air_force_nuclear_deterrence_operations_service_ribbon.png' },
  { country: 'United States', branch: 'US Campaign Medals', name: 'Remote Combat Effects Campaign Medal', url: 'https://www.uniformribbons.com/image/remote_combat_effects_campaign_ribbon.png' },
  { country: 'United States', branch: 'US Service Medals', name: 'Air Force Overseas Short Service Ribbon', url: 'https://www.uniformribbons.com/image/air_force_overseas_short_ribbon.png' },
  { country: 'United States', branch: 'US Service Medals', name: 'Air Force Overseas Long Service Ribbon', url: 'https://www.uniformribbons.com/image/air_force_overseas_long_ribbon.png' },
  { country: 'United States', branch: 'US Service Medals', name: 'Air Force Expeditionary Service Ribbon With Gold Frame', url: 'https://www.uniformribbons.com/image/air_force_expeditionary_service_ribbon_gold_frame.png' },
  { country: 'United States', branch: 'US Service Medals', name: 'Air Force Expeditionary Service Ribbon', url: 'https://www.uniformribbons.com/image/air_force_expeditionary_service_ribbon.png' },
  { country: 'United States', branch: 'US Long Service', name: 'Air Force Longetivity Service Ribbon', url: 'https://www.uniformribbons.com/image/air_force_longetivity_service_ribbon.png' },
  { country: 'United States', branch: 'US Long Service', name: 'Air Force Special Duty Ribbon', url: 'https://www.uniformribbons.com/image/air_force_special_duty_ribbon.png' },
  { country: 'United States', branch: 'US Long Service', name: 'Air Force Basic Military Training Instructor Ribbon', url: 'https://www.uniformribbons.com/image/air_force_basic_military_training_instructor_ribbon.png' },
  { country: 'United States', branch: 'US Long Service', name: 'Air Force Recruiter Ribbon', url: 'https://www.uniformribbons.com/image/air_force_recruiter_ribbon.png' },
  { country: 'United States', branch: 'US Long Service', name: 'Non-Commissioned Officer Professional Development Ribbon', url: 'https://www.uniformribbons.com/image/noncommissioned_officer_professional_development_ribbon.png' },
  { country: 'United States', branch: 'US Long Service', name: 'Air Force BMT Honor Graduate Ribbon', url: 'https://www.uniformribbons.com/image/air_force_BMT_honor_graduate_ribbon.png' },
  { country: 'United States', branch: 'US Long Service', name: 'Small Arms Expert Marksmanship Ribbon', url: 'https://www.uniformribbons.com/image/small_arms_expert_marksmanship_ribbon.png' },
  { country: 'United States', branch: 'US Long Service', name: 'Air Force Training Ribbon', url: 'https://www.uniformribbons.com/image/air_force_training_ribbon.png' },
  { country: 'United States', branch: 'US Orders & Distinguished Service', name: 'Air Force Distinguished Service Medal Ribbon', url: 'https://www.uniformribbons.com/image/air_force_distinguished_service_ribbon.png' },
  { country: 'United States', branch: 'US Gallantry', name: 'Airman Medal Ribbon', url: 'https://www.uniformribbons.com/image/airman_ribbon.png' },
  { country: 'United States', branch: 'US Orders & Distinguished Service', name: 'Air Reserve Meritorious Service Medal Ribbon', url: 'https://www.uniformribbons.com/image/air_reserve_meritorious_service_ribbon.png' },

  // ─── CZECH REPUBLIC ─────────────────────────────────────────────────────────
  // Orders & Distinguished Service
  // Military Order of the White Lion (re-established 1994, military division) - all 5 grades
  { country: 'Czech Republic', branch: 'Czech Republic Orders & Distinguished Service', name: 'Military Order of the White Lion - 1st Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/CZE_Rad_Bileho_Lva_1_tridy_BAR.svg/250px-CZE_Rad_Bileho_Lva_1_tridy_BAR.svg.png' },
  { country: 'Czech Republic', branch: 'Czech Republic Orders & Distinguished Service', name: 'Military Order of the White Lion - 2nd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/CZE_Rad_Bileho_Lva_2_tridy_BAR.svg/250px-CZE_Rad_Bileho_Lva_2_tridy_BAR.svg.png' },
  { country: 'Czech Republic', branch: 'Czech Republic Orders & Distinguished Service', name: 'Military Order of the White Lion - 3rd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/CZE_Rad_Bileho_Lva_3_tridy_BAR.svg/250px-CZE_Rad_Bileho_Lva_3_tridy_BAR.svg.png' },
  { country: 'Czech Republic', branch: 'Czech Republic Orders & Distinguished Service', name: 'Military Order of the White Lion - 4th Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/CZE_Rad_Bileho_Lva_4_tridy_BAR.svg/250px-CZE_Rad_Bileho_Lva_4_tridy_BAR.svg.png' },
  { country: 'Czech Republic', branch: 'Czech Republic Orders & Distinguished Service', name: 'Military Order of the White Lion - 5th Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/CZE_Rad_Bileho_Lva_5_tridy_BAR.svg/250px-CZE_Rad_Bileho_Lva_5_tridy_BAR.svg.png' },
  // Cross of Merit of the Minister of Defence - 3 grades
  { country: 'Czech Republic', branch: 'Czech Republic Orders & Distinguished Service', name: 'Cross of Merit of the Minister of Defence - 1st Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/CZE_Cross_of_Merit_Min-of-Def_1st_BAR.svg/250px-CZE_Cross_of_Merit_Min-of-Def_1st_BAR.svg.png' },
  { country: 'Czech Republic', branch: 'Czech Republic Orders & Distinguished Service', name: 'Cross of Merit of the Minister of Defence - 2nd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/CZE_Cross_of_Merit_Min-of-Def_2nd_BAR.svg/250px-CZE_Cross_of_Merit_Min-of-Def_2nd_BAR.svg.png' },
  { country: 'Czech Republic', branch: 'Czech Republic Orders & Distinguished Service', name: 'Cross of Merit of the Minister of Defence - 3rd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/CZE_Cross_of_Merit_Min-of-Def_3rd_BAR.svg/250px-CZE_Cross_of_Merit_Min-of-Def_3rd_BAR.svg.png' },
  // Honour Badge of the Czech Armed Forces for Merit (3rd class confirmed ribbon)
  { country: 'Czech Republic', branch: 'Czech Republic Orders & Distinguished Service', name: 'Honour Badge of the Czech Armed Forces for Merit', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/CZE_Cestny_Odznak_ACR_Za_zasluhy_3st_BAR.svg/250px-CZE_Cestny_Odznak_ACR_Za_zasluhy_3st_BAR.svg.png' },
  // Military Logistics Commemorative Badge
  { country: 'Czech Republic', branch: 'Czech Republic Orders & Distinguished Service', name: 'Military Logistics Commemorative Badge', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/CZE_Pametni_Odznak_Vojenske_Logistiky_BAR.svg/250px-CZE_Pametni_Odznak_Vojenske_Logistiky_BAR.svg.png' },
  // Gallantry / Wounds
  { country: 'Czech Republic', branch: 'Czech Republic Gallantry', name: 'Medal for Injury (Wound Medal)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/CZE_Medaile_za_zraneni_BAR.svg/250px-CZE_Medaile_za_zraneni_BAR.svg.png' },
  // Service Medals
  { country: 'Czech Republic', branch: 'Czech Republic Service Medals', name: 'Medal of the Armed Forces of the Czech Republic - 1st Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/CZE_Medaile_Za_Sluzbu_v_OS_CR_1st_BAR.svg/250px-CZE_Medaile_Za_Sluzbu_v_OS_CR_1st_BAR.svg.png' },
  { country: 'Czech Republic', branch: 'Czech Republic Service Medals', name: 'Medal of the Armed Forces of the Czech Republic - 1st Class (20 yrs)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/CZE_Medaile_Za_Sluzbu_v_OS_CR_1st_XX_BAR.svg/250px-CZE_Medaile_Za_Sluzbu_v_OS_CR_1st_XX_BAR.svg.png' },
  { country: 'Czech Republic', branch: 'Czech Republic Service Medals', name: 'Medal of the Armed Forces of the Czech Republic - 2nd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/CZE_Medaile_Za_Sluzbu_v_OS_CR_2st_BAR.svg/250px-CZE_Medaile_Za_Sluzbu_v_OS_CR_2st_BAR.svg.png' },
  { country: 'Czech Republic', branch: 'Czech Republic Service Medals', name: 'Medal of the Armed Forces of the Czech Republic - 3rd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/CZE_Medaile_Za_Sluzbu_v_OS_CR_3st_BAR.svg/250px-CZE_Medaile_Za_Sluzbu_v_OS_CR_3st_BAR.svg.png' },
  // Campaign Medals - Medal for Service Abroad (theatre-specific series)
  { country: 'Czech Republic', branch: 'Czech Republic Campaign Medals', name: 'Medal for Service Abroad (generic)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/CZE_Medal_For_Service_Abroad.svg/250px-CZE_Medal_For_Service_Abroad.svg.png' },
  { country: 'Czech Republic', branch: 'Czech Republic Campaign Medals', name: 'Medal for Service Abroad - SFOR (Bosnia) 1st Award', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/CZE_MoD_Medal_For_Service_Abroad_SFOR_1st_BAR.svg/250px-CZE_MoD_Medal_For_Service_Abroad_SFOR_1st_BAR.svg.png' },
  { country: 'Czech Republic', branch: 'Czech Republic Campaign Medals', name: 'Medal for Service Abroad - SFOR (Bosnia) 2nd Award', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/CZE_MoD_Medal_For_Service_Abroad_SFOR_2st_BAR.svg/250px-CZE_MoD_Medal_For_Service_Abroad_SFOR_2st_BAR.svg.png' },
  { country: 'Czech Republic', branch: 'Czech Republic Campaign Medals', name: 'Medal for Service Abroad - KFOR (Kosovo) 1st Award', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/CZE_MoD_Medal_For_Service_Abroad_KFOR_1st_BAR.svg/250px-CZE_MoD_Medal_For_Service_Abroad_KFOR_1st_BAR.svg.png' },
  { country: 'Czech Republic', branch: 'Czech Republic Campaign Medals', name: 'Medal for Service Abroad - KFOR (Kosovo) 2nd Award', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/CZE_MoD_Medal_For_Service_Abroad_KFOR_2st_BAR.svg/250px-CZE_MoD_Medal_For_Service_Abroad_KFOR_2st_BAR.svg.png' },
  { country: 'Czech Republic', branch: 'Czech Republic Campaign Medals', name: 'Medal for Service Abroad - KFOR (Kosovo) 3rd Award', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/CZE_MoD_Medal_For_Service_Abroad_KFOR_3st_BAR.svg/250px-CZE_MoD_Medal_For_Service_Abroad_KFOR_3st_BAR.svg.png' },
  { country: 'Czech Republic', branch: 'Czech Republic Campaign Medals', name: 'Medal for Service Abroad - Iraq 1st Award', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/CZE_MoD_Medal_For_Service_Abroad_Iraq_1st_BAR.svg/250px-CZE_MoD_Medal_For_Service_Abroad_Iraq_1st_BAR.svg.png' },
  { country: 'Czech Republic', branch: 'Czech Republic Campaign Medals', name: 'Medal for Service Abroad - Iraq 2nd Award', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/CZE_MoD_Medal_For_Service_Abroad_Iraq_2st_BAR.svg/250px-CZE_MoD_Medal_For_Service_Abroad_Iraq_2st_BAR.svg.png' },
  { country: 'Czech Republic', branch: 'Czech Republic Campaign Medals', name: 'Medal for Service Abroad - Iraq 3rd Award', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/CZE_MoD_Medal_For_Service_Abroad_Iraq_3st_BAR.svg/250px-CZE_MoD_Medal_For_Service_Abroad_Iraq_3st_BAR.svg.png' },
  { country: 'Czech Republic', branch: 'Czech Republic Campaign Medals', name: 'Medal for Service Abroad - ISAF (Afghanistan) 1st Award', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/CZE_MoD_Medal_For_Service_Abroad_ISAF_1st_BAR.svg/250px-CZE_MoD_Medal_For_Service_Abroad_ISAF_1st_BAR.svg.png' },
  { country: 'Czech Republic', branch: 'Czech Republic Campaign Medals', name: 'Medal for Service Abroad - ISAF (Afghanistan) 2nd Award', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/CZE_MoD_Medal_For_Service_Abroad_ISAF_2st_BAR.svg/250px-CZE_MoD_Medal_For_Service_Abroad_ISAF_2st_BAR.svg.png' },
  { country: 'Czech Republic', branch: 'Czech Republic Campaign Medals', name: 'Medal for Service Abroad - ISAF (Afghanistan) 3rd Award', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/CZE_MoD_Medal_For_Service_Abroad_ISAF_3st_BAR.svg/250px-CZE_MoD_Medal_For_Service_Abroad_ISAF_3st_BAR.svg.png' },
  { country: 'Czech Republic', branch: 'Czech Republic Campaign Medals', name: 'Medal for Service Abroad - Enhanced Forward Presence 1st Award', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/CZE_MoD_Medal_For_Service_Abroad_EF_1st_BAR.svg/250px-CZE_MoD_Medal_For_Service_Abroad_EF_1st_BAR.svg.png' },
  { country: 'Czech Republic', branch: 'Czech Republic Campaign Medals', name: 'Medal for Service Abroad - Enhanced Forward Presence 2nd Award', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/CZE_MoD_Medal_For_Service_Abroad_EF_2st_BAR.svg/250px-CZE_MoD_Medal_For_Service_Abroad_EF_2st_BAR.svg.png' },
  { country: 'Czech Republic', branch: 'Czech Republic Campaign Medals', name: 'Medal for Service Abroad - Enhanced Forward Presence 3rd Award', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/CZE_MoD_Medal_For_Service_Abroad_EF_3st_BAR.svg/250px-CZE_MoD_Medal_For_Service_Abroad_EF_3st_BAR.svg.png' },
  { country: 'Czech Republic', branch: 'Czech Republic Campaign Medals', name: 'Medal for Service Abroad - Africa 1st Award', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/CZE_MoD_Medal_For_Service_Abroad_Africa_1st_BAR.svg/250px-CZE_MoD_Medal_For_Service_Abroad_Africa_1st_BAR.svg.png' },
  { country: 'Czech Republic', branch: 'Czech Republic Campaign Medals', name: 'Medal for Service Abroad - Africa 2nd Award', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/CZE_MoD_Medal_For_Service_Abroad_Africa_2st_BAR.svg/250px-CZE_MoD_Medal_For_Service_Abroad_Africa_2st_BAR.svg.png' },
  { country: 'Czech Republic', branch: 'Czech Republic Campaign Medals', name: 'Medal for Service Abroad - Africa 3rd Award', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/CZE_MoD_Medal_For_Service_Abroad_Africa_3st_BAR.svg/250px-CZE_MoD_Medal_For_Service_Abroad_Africa_3st_BAR.svg.png' },
  { country: 'Czech Republic', branch: 'Czech Republic Campaign Medals', name: 'Medal for Service Abroad - Combat 1st Award', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/CZE_MoD_Medal_For_Service_Abroad_Combat_1st_BAR.svg/250px-CZE_MoD_Medal_For_Service_Abroad_Combat_1st_BAR.svg.png' },
  { country: 'Czech Republic', branch: 'Czech Republic Campaign Medals', name: 'Medal for Service Abroad - Combat 2nd Award', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/CZE_MoD_Medal_For_Service_Abroad_Combat_2st_BAR.svg/250px-CZE_MoD_Medal_For_Service_Abroad_Combat_2st_BAR.svg.png' },
  { country: 'Czech Republic', branch: 'Czech Republic Campaign Medals', name: 'Medal for Service Abroad - Combat 3rd Award', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/CZE_MoD_Medal_For_Service_Abroad_Combat_3st_BAR.svg/250px-CZE_MoD_Medal_For_Service_Abroad_Combat_3st_BAR.svg.png' },

  // ─── SWEDEN ──────────────────────────────────────────────────────────────────
  // Orders (Royal Orders - reactivated 2023, first awarded March 2024)
  { country: 'Sweden', branch: 'Sweden Orders', name: 'Royal Order of the Seraphim', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Seraphimerorden_ribbon.svg/250px-Seraphimerorden_ribbon.svg.png' },
  // Royal Order of the Sword
  { country: 'Sweden', branch: 'Sweden Orders', name: 'Royal Order of the Sword - Grand Cross', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Ruotsin_miekkaritarikunnan_suurristin_nauha.png/250px-Ruotsin_miekkaritarikunnan_suurristin_nauha.png' },
  { country: 'Sweden', branch: 'Sweden Orders', name: 'Royal Order of the Sword - Commander', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Ruotsin_miekkaritarikunnan_komenta_nauha.png/250px-Ruotsin_miekkaritarikunnan_komenta_nauha.png' },
  { country: 'Sweden', branch: 'Sweden Orders', name: 'Royal Order of the Sword - Knight 1st Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Ruotsin_miekkaritarikunnan_ritarimerkin_nauha.png/250px-Ruotsin_miekkaritarikunnan_ritarimerkin_nauha.png' },
  { country: 'Sweden', branch: 'Sweden Orders', name: 'Royal Order of the Sword - Knight', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Ruotsin_miekkaritarikunnan_nauha.png/250px-Ruotsin_miekkaritarikunnan_nauha.png' },
  // Royal Order of Vasa (reactivated 2023)
  { country: 'Sweden', branch: 'Sweden Orders', name: 'Royal Order of Vasa - Commander Grand Cross', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/SWE_Order_of_Vasa_-_Commander_Grand_Cross_BAR.png/250px-SWE_Order_of_Vasa_-_Commander_Grand_Cross_BAR.png' },
  { country: 'Sweden', branch: 'Sweden Orders', name: 'Royal Order of Vasa - Commander 1st Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/SWE_Order_of_Vasa_-_Commander_1st_Class_BAR.png/250px-SWE_Order_of_Vasa_-_Commander_1st_Class_BAR.png' },
  { country: 'Sweden', branch: 'Sweden Orders', name: 'Royal Order of Vasa - Commander', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/SWE_Order_of_Vasa_-_Commander_BAR.png/250px-SWE_Order_of_Vasa_-_Commander_BAR.png' },
  { country: 'Sweden', branch: 'Sweden Orders', name: 'Royal Order of Vasa - Knight 1st Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/SWE_Order_of_Vasa_-_Knight_1st_Class_BAR.png/250px-SWE_Order_of_Vasa_-_Knight_1st_Class_BAR.png' },
  { country: 'Sweden', branch: 'Sweden Orders', name: 'Royal Order of Vasa - Knight 2nd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/SWE_Order_of_Vasa_-_Knight_2nd_Class_BAR.png/250px-SWE_Order_of_Vasa_-_Knight_2nd_Class_BAR.png' },
  // Military Medals
  // Swedish Armed Forces Medal of Merit (1995-2009 with sword variants)
  { country: 'Sweden', branch: 'Sweden Military Medals', name: 'Swedish Armed Forces Medal of Merit with Sword - Gold (1995-2007)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/F%C3%B6rsvarsmaktens_f%C3%B6rtj%C3%A4nstmedalj_%281995%E2%80%932007%29_med_sv%C3%A4rd_i_guld.png/250px-F%C3%B6rsvarsmaktens_f%C3%B6rtj%C3%A4nstmedalj_%281995%E2%80%932007%29_med_sv%C3%A4rd_i_guld.png' },
  { country: 'Sweden', branch: 'Sweden Military Medals', name: 'Swedish Armed Forces Medal of Merit with Sword - Silver (1995-2007)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/F%C3%B6rsvarsmaktens_f%C3%B6rtj%C3%A4nstmedalj_%281995%E2%80%932007%29_med_sv%C3%A4rd_i_silver.png/250px-F%C3%B6rsvarsmaktens_f%C3%B6rtj%C3%A4nstmedalj_%281995%E2%80%932007%29_med_sv%C3%A4rd_i_silver.png' },
  { country: 'Sweden', branch: 'Sweden Military Medals', name: 'Swedish Armed Forces Medal of Merit (1995-2007)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/F%C3%B6rsvarsmaktens_f%C3%B6rtj%C3%A4nstmedalj_%281995%E2%80%932007%29_utan_sv%C3%A4rd.png/250px-F%C3%B6rsvarsmaktens_f%C3%B6rtj%C3%A4nstmedalj_%281995%E2%80%932007%29_utan_sv%C3%A4rd.png' },
  // Swedish Armed Forces Medal of Merit (2008-2023 series)
  { country: 'Sweden', branch: 'Sweden Military Medals', name: 'Swedish Armed Forces Medal of Merit - Gold (2008-2023)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/FMGM.png/250px-FMGM.png' },
  { country: 'Sweden', branch: 'Sweden Military Medals', name: 'Swedish Armed Forces Medal of Merit - Silver (2008-2023)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/FMGMmsv.png/250px-FMGMmsv.png' },
  // Swedish Armed Forces Medal for Wounded in Battle (2011-)
  { country: 'Sweden', branch: 'Sweden Military Medals', name: 'Swedish Armed Forces Medal for Wounded in Battle - Silver with Star', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/FMSMsismstj.png/250px-FMSMsismstj.png' },
  { country: 'Sweden', branch: 'Sweden Military Medals', name: 'Swedish Armed Forces Medal for Wounded in Battle - Silver', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/FMSNsismstj2.png/250px-FMSNsismstj2.png' },
  // Swedish Armed Forces International Service Medal (1991-)
  { country: 'Sweden', branch: 'Sweden Military Medals', name: 'Swedish Armed Forces International Service Medal with Sword - Silver', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/FMintGMmsv_bar.png/250px-FMintGMmsv_bar.png' },
  { country: 'Sweden', branch: 'Sweden Military Medals', name: 'Swedish Armed Forces International Service Medal - Silver', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/FMintSMmsv.png/250px-FMintSMmsv.png' },
  // Reserve Officer Medal (2003/2008-)
  { country: 'Sweden', branch: 'Sweden Military Medals', name: 'Swedish Armed Forces Reserve Officer Medal', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/FMresoffSM_-_F%C3%B6rsvarsmaktens_reservofficersmedalj_%28Sverige%29.png/250px-FMresoffSM_-_F%C3%B6rsvarsmaktens_reservofficersmedalj_%28Sverige%29.png' },
  // Service Medal for National Defence (2015-)
  { country: 'Sweden', branch: 'Sweden Long Service', name: 'Swedish Armed Forces Service Medal for National Defence', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/SWE_Armed_Forces_Medal_for_National_Defense.png/250px-SWE_Armed_Forces_Medal_for_National_Defense.png' },
  // Service Medal
  { country: 'Sweden', branch: 'Sweden Long Service', name: 'Swedish Armed Forces Service Medal - Silver', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/FMSMmsv.png/250px-FMSMmsv.png' },
  { country: 'Sweden', branch: 'Sweden Long Service', name: 'Swedish Armed Forces Service Medal', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/FMSMsis.png/250px-FMSMsis.png' },

  // ─── SLOVAKIA ────────────────────────────────────────────────────────────────
  // Orders - Pribina Cross (merit order awarded to military personnel)
  { country: 'Slovakia', branch: 'Slovakia Orders', name: 'Pribina Cross - 1st Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/SVK_Pribinov_Kriz_1_triedy_BAR.svg/250px-SVK_Pribinov_Kriz_1_triedy_BAR.svg.png' },
  { country: 'Slovakia', branch: 'Slovakia Orders', name: 'Pribina Cross - 2nd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/SVK_Pribinov_Kriz_2_triedy_BAR.svg/250px-SVK_Pribinov_Kriz_2_triedy_BAR.svg.png' },
  { country: 'Slovakia', branch: 'Slovakia Orders', name: 'Pribina Cross - 3rd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/SVK_Pribinov_Kriz_3_triedy_BAR.svg/250px-SVK_Pribinov_Kriz_3_triedy_BAR.svg.png' },
  // White Double Cross (awarded to foreign military & diplomats - borderline keep as international prestige award)
  { country: 'Slovakia', branch: 'Slovakia Orders', name: 'Order of the White Double Cross - 1st Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/SVK_Rad_Bieleho_Dvojkriza_1_triedy_BAR.svg/250px-SVK_Rad_Bieleho_Dvojkriza_1_triedy_BAR.svg.png' },
  { country: 'Slovakia', branch: 'Slovakia Orders', name: 'Order of the White Double Cross - 2nd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/SVK_Rad_Bieleho_Dvojkriza_2_triedy_BAR.svg/250px-SVK_Rad_Bieleho_Dvojkriza_2_triedy_BAR.svg.png' },
  { country: 'Slovakia', branch: 'Slovakia Orders', name: 'Order of the White Double Cross - 3rd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/SVK_Rad_Bieleho_Dvojkriza_3_triedy_BAR.svg/250px-SVK_Rad_Bieleho_Dvojkriza_3_triedy_BAR.svg.png' },
  // Gallantry
  { country: 'Slovakia', branch: 'Slovakia Gallantry', name: 'Medal for Bravery', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/SVK_Medaila_za_statocnost_BAR.svg/250px-SVK_Medaila_za_statocnost_BAR.svg.png' },
  { country: 'Slovakia', branch: 'Slovakia Gallantry', name: 'Medal for Wounds in Combat', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/SVK_Medaila_Za_zranenie_v_boji_3x_BAR.svg/250px-SVK_Medaila_Za_zranenie_v_boji_3x_BAR.svg.png' },
  // Service Medals
  { country: 'Slovakia', branch: 'Slovakia Service Medals', name: 'Medal of the President of the Slovak Republic (2001)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/SVK_Medaila_prezidenta_SR_2001_BAR.svg/250px-SVK_Medaila_prezidenta_SR_2001_BAR.svg.png' },
  { country: 'Slovakia', branch: 'Slovakia Service Medals', name: 'Medal of the President of the Slovak Republic (2008)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/SVK_Medaila_prezidenta_SR_2008_BAR.svg/250px-SVK_Medaila_prezidenta_SR_2008_BAR.svg.png' },
  { country: 'Slovakia', branch: 'Slovakia Service Medals', name: 'Gratitude Medal', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/SVK_Gratitude_Medal_BAR.svg/250px-SVK_Gratitude_Medal_BAR.svg.png' },
  { country: 'Slovakia', branch: 'Slovakia Service Medals', name: 'Medal for Humanitarian Aid', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/SVK_Medaila_Za_humanitarnu_pomoc_BAR.svg/250px-SVK_Medaila_Za_humanitarnu_pomoc_BAR.svg.png' },
  { country: 'Slovakia', branch: 'Slovakia Service Medals', name: 'Medal for Observer of Peacekeeping Missions', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/SVK_Med_Observer_Peacekeeping_Missions_2002_%28V%29_BAR.svg/250px-SVK_Med_Observer_Peacekeeping_Missions_2002_%28V%29_BAR.svg.png' },
  { country: 'Slovakia', branch: 'Slovakia Service Medals', name: 'Medal of Military Counterintelligence - 1st Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/SVK_Med_voj_obranneho_spravodajstva_1-st_BAR.png/250px-SVK_Med_voj_obranneho_spravodajstva_1-st_BAR.png' },
  { country: 'Slovakia', branch: 'Slovakia Service Medals', name: 'Medal of Military Counterintelligence - 2nd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/SVK_Med_voj_obranneho_spravodajstva_2-st_BAR.png/250px-SVK_Med_voj_obranneho_spravodajstva_2-st_BAR.png' },
  { country: 'Slovakia', branch: 'Slovakia Service Medals', name: 'Medal of Military Counterintelligence - 3rd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/SVK_Med_voj_obranneho_spravodajstva_3-st_BAR.png/250px-SVK_Med_voj_obranneho_spravodajstva_3-st_BAR.png' },
  { country: 'Slovakia', branch: 'Slovakia Service Medals', name: 'Medal of Military Intelligence Service - 1st Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/SVK_Med_voj_spravodajskej_sluzby_1-st_BAR.png/250px-SVK_Med_voj_spravodajskej_sluzby_1-st_BAR.png' },
  { country: 'Slovakia', branch: 'Slovakia Service Medals', name: 'Medal of Military Intelligence Service - 2nd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/SVK_Med_voj_spravodajskej_sluzby_2-st_BAR.png/250px-SVK_Med_voj_spravodajskej_sluzby_2-st_BAR.png' },
  { country: 'Slovakia', branch: 'Slovakia Service Medals', name: 'Medal of Military Intelligence Service - 3rd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/SVK_Med_voj_spravodajskej_sluzby_3-st_BAR.png/250px-SVK_Med_voj_spravodajskej_sluzby_3-st_BAR.png' },
  // Commemorative
  { country: 'Slovakia', branch: 'Slovakia Commemorative', name: 'Commemorative Medal of the Minister of Defence - 1st Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/SVK_Commemorative_Medal_Min-of-Def_1st_BAR.svg/250px-SVK_Commemorative_Medal_Min-of-Def_1st_BAR.svg.png' },
  { country: 'Slovakia', branch: 'Slovakia Commemorative', name: 'Commemorative Medal of the Minister of Defence - 2nd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/SVK_Commemorative_Medal_Min-of-Def_2nd_BAR.svg/250px-SVK_Commemorative_Medal_Min-of-Def_2nd_BAR.svg.png' },
  { country: 'Slovakia', branch: 'Slovakia Commemorative', name: 'Commemorative Medal of the Minister of Defence - 3rd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/SVK_Commemorative_Medal_Min-of-Def_3rd_BAR.svg/250px-SVK_Commemorative_Medal_Min-of-Def_3rd_BAR.svg.png' },
  { country: 'Slovakia', branch: 'Slovakia Commemorative', name: 'Commemorative Cross of the Chief of General Staff - 1st Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/SVK_Pamatny_kriz_nacelnika_GS_OSSR_1-st_BAR.svg/250px-SVK_Pamatny_kriz_nacelnika_GS_OSSR_1-st_BAR.svg.png' },
  { country: 'Slovakia', branch: 'Slovakia Commemorative', name: 'Commemorative Cross of the Chief of General Staff - 2nd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/SVK_Pamatny_kriz_nacelnika_GS_OSSR_2-st_BAR.svg/250px-SVK_Pamatny_kriz_nacelnika_GS_OSSR_2-st_BAR.svg.png' },
  { country: 'Slovakia', branch: 'Slovakia Commemorative', name: 'Commemorative Cross of the Chief of General Staff - 3rd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/SVK_Pamatny_kriz_nacelnika_GS_OSSR_3-st_BAR.svg/250px-SVK_Pamatny_kriz_nacelnika_GS_OSSR_3-st_BAR.svg.png' },
  { country: 'Slovakia', branch: 'Slovakia Commemorative', name: 'Commemorative Medal for 20th Anniversary of Slovak Armed Forces', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/SVK_Pam_Med_k20_vyr_vzn_OSSR_BAR.svg/250px-SVK_Pam_Med_k20_vyr_vzn_OSSR_BAR.svg.png' },

  // ─── GEORGIA ─────────────────────────────────────────────────────────────────
  { country: 'Georgia', branch: 'Georgia Orders', name: 'Order of Vakhtang Gorgasali - 1st Rank', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/GEO_Vakhtang_Gorgasal_Order_1rank_BAR.svg/250px-GEO_Vakhtang_Gorgasal_Order_1rank_BAR.svg.png' },
  { country: 'Georgia', branch: 'Georgia Orders', name: 'Order of Vakhtang Gorgasali - 2nd Rank', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/GEO_Vakhtang_Gorgasal_Order_2rank_BAR.svg/250px-GEO_Vakhtang_Gorgasal_Order_2rank_BAR.svg.png' },
  { country: 'Georgia', branch: 'Georgia Orders', name: 'Order of Vakhtang Gorgasali - 3rd Rank', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/GEO_Vakhtang_Gorgasal_Order_3rank_BAR.svg/250px-GEO_Vakhtang_Gorgasal_Order_3rank_BAR.svg.png' },
  { country: 'Georgia', branch: 'Georgia Orders', name: 'Order of David the Builder', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/GEO_David_Agmashenebeli_Order_BAR.svg/250px-GEO_David_Agmashenebeli_Order_BAR.svg.png' },
  { country: 'Georgia', branch: 'Georgia Orders', name: 'Order of Honor', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Order_of_Honor_%28Georgia%29_ribbon.svg/250px-Order_of_Honor_%28Georgia%29_ribbon.svg.png' },
  { country: 'Georgia', branch: 'Georgia Service Medals', name: 'Medal of Military Courage', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/GEO_Military_Courage_Medal_BAR.svg/250px-GEO_Military_Courage_Medal_BAR.svg.png' },
  { country: 'Georgia', branch: 'Georgia Service Medals', name: 'Medal of Military Honor', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/GEO_Military_Honor_Medal_BAR.svg/250px-GEO_Military_Honor_Medal_BAR.svg.png' },
  { country: 'Georgia', branch: 'Georgia Service Medals', name: 'Medal of Honor', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/GEO_Honor_Medal_BAR.svg/250px-GEO_Honor_Medal_BAR.svg.png' },

  // ─── IRAN ─────────────────────────────────────────────────────────────────────
  { country: 'Iran', branch: 'Iran Orders', name: 'Order of Fath - 1st Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Order_of_Fat%27h_%281st_Class%29.svg/250px-Order_of_Fat%27h_%281st_Class%29.svg.png' },
  { country: 'Iran', branch: 'Iran Orders', name: 'Order of Fath - 2nd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Order_of_Fat%27h_%282nd_Class%29.svg/250px-Order_of_Fat%27h_%282nd_Class%29.svg.png' },
  { country: 'Iran', branch: 'Iran Orders', name: 'Order of Fath - 3rd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Order_of_Fat%27h_%283rd_Class%29.svg/250px-Order_of_Fat%27h_%283rd_Class%29.svg.png' },
  { country: 'Iran', branch: 'Iran Orders', name: 'Order of Nasr', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Order_of_Nasr_Ribbon.svg/250px-Order_of_Nasr_Ribbon.svg.png' },
  { country: 'Iran', branch: 'Iran Gallantry', name: 'Zulfaqar Combat Badge', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/IRIA_Zulfaqar_Ribbon.svg/250px-IRIA_Zulfaqar_Ribbon.svg.png' },
  { country: 'Iran', branch: 'Iran Gallantry', name: 'Jihad Merit Badge', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/IRIA_Jihad_Ribbon.svg/250px-IRIA_Jihad_Ribbon.svg.png' },
  { country: 'Iran', branch: 'Iran Service Medals', name: 'Strategic Sciences Course Ribbon', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/IRIA_Strategic_Sciences_Ribbon.svg/250px-IRIA_Strategic_Sciences_Ribbon.svg.png' },
  { country: 'Iran', branch: 'Iran Service Medals', name: 'Supervision Course Ribbon', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/IRIA_Supervision_Ribbon.svg/250px-IRIA_Supervision_Ribbon.svg.png' },
  { country: 'Iran', branch: 'Iran Service Medals', name: 'Military University 3rd Year Ribbon', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/IRIA_Military_University_3rd_Year_Ribbon_Bar.svg/250px-IRIA_Military_University_3rd_Year_Ribbon_Bar.svg.png' },

  // ─── NORTH KOREA ─────────────────────────────────────────────────────────────
  { country: 'North Korea', branch: 'North Korea Orders', name: 'Order of Kim Il-sung', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/DPRK_ribbon_bar_-_Order_of_Kim_Il-sung.svg/250px-DPRK_ribbon_bar_-_Order_of_Kim_Il-sung.svg.png' },
  { country: 'North Korea', branch: 'North Korea Orders', name: 'Order of the National Flag - 1st Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/DPRK_ribbon_bar_-_Order_of_National_Flag_1st_Class.svg/250px-DPRK_ribbon_bar_-_Order_of_National_Flag_1st_Class.svg.png' },
  { country: 'North Korea', branch: 'North Korea Orders', name: 'Order of the National Flag - 2nd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/DPRK_ribbon_bar_-_Order_of_National_Flag_2nd_Class.svg/250px-DPRK_ribbon_bar_-_Order_of_National_Flag_2nd_Class.svg.png' },
  { country: 'North Korea', branch: 'North Korea Orders', name: 'Order of the National Flag - 3rd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/DPRK_ribbon_bar_-_Order_of_National_Flag_3rd_Class.svg/250px-DPRK_ribbon_bar_-_Order_of_National_Flag_3rd_Class.svg.png' },
  { country: 'North Korea', branch: 'North Korea Orders', name: 'Order of Friendship - 1st Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/DPRK_ribbon_bar_-_Order_of_Friendship_1st_Class.svg/250px-DPRK_ribbon_bar_-_Order_of_Friendship_1st_Class.svg.png' },
  { country: 'North Korea', branch: 'North Korea Orders', name: 'Order of Friendship - 2nd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/DPRK_ribbon_bar_-_Order_of_Friendship_2nd_Class.svg/250px-DPRK_ribbon_bar_-_Order_of_Friendship_2nd_Class.svg.png' },
  { country: 'North Korea', branch: 'North Korea Orders', name: 'Order of Friendship Medal', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/DPRK_ribbon_bar_-_Order_of_Friendship_Medal.svg/250px-DPRK_ribbon_bar_-_Order_of_Friendship_Medal.svg.png' },
  { country: 'North Korea', branch: 'North Korea Orders', name: 'Order of the Kunjari', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/DPRK_ribbon_bar_-_Order_of_Kunjari.svg/250px-DPRK_ribbon_bar_-_Order_of_Kunjari.svg.png' },
  { country: 'North Korea', branch: 'North Korea Orders', name: 'Order of Labour', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/DPRK_ribbon_bar_-_Order_of_Labor_V2.svg/250px-DPRK_ribbon_bar_-_Order_of_Labor_V2.svg.png' },
  { country: 'North Korea', branch: 'North Korea Service Medals', name: 'Order of Military Service Honour Medal', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/DPRK_ribbon_bar_-_Order_of_Military_Service_Honor_Medal.svg/250px-DPRK_ribbon_bar_-_Order_of_Military_Service_Honor_Medal.svg.png' },
  { country: 'North Korea', branch: 'North Korea Service Medals', name: 'Meritorious Service Medal', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/DPRK_ribbon_bar_-_Meritorious_Service_Medal.svg/250px-DPRK_ribbon_bar_-_Meritorious_Service_Medal.svg.png' },
  { country: 'North Korea', branch: 'North Korea Service Medals', name: 'Military Merit Medal', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/DPRK_ribbon_bar_-_Military_Merit_Medal.svg/250px-DPRK_ribbon_bar_-_Military_Merit_Medal.svg.png' },
  { country: 'North Korea', branch: 'North Korea Commemorative', name: 'Fatherland Liberation War Commemorative Medal', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/DPRK_ribbon_bar_-_Fatherland_Liberation_War_Commemoration_Medal.svg/250px-DPRK_ribbon_bar_-_Fatherland_Liberation_War_Commemoration_Medal.svg.png' },
  { country: 'North Korea', branch: 'North Korea Commemorative', name: 'DPRK Foundation Commemorative Medal', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/DPRK_ribbon_bar_-_DPRK_Foundation_Commemoration_Medal.svg/250px-DPRK_ribbon_bar_-_DPRK_Foundation_Commemoration_Medal.svg.png' },

  // ─── PAKISTAN ─────────────────────────────────────────────────────────────────
  { country: 'Pakistan', branch: 'Pakistan Gallantry', name: 'Nishan-e-Haider (Order of the Lion)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Nishan-e-Haider_Ribbon_Bar.png/250px-Nishan-e-Haider_Ribbon_Bar.png' },
  { country: 'Pakistan', branch: 'Pakistan Gallantry', name: 'Hilal-e-Jurat (Crescent of Courage)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Hilal-e-Jurat.png/250px-Hilal-e-Jurat.png' },
  { country: 'Pakistan', branch: 'Pakistan Gallantry', name: 'Sitara-e-Jurat (Star of Courage)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/PAK_Sitara-i-Juraat_ribbon.svg/250px-PAK_Sitara-i-Juraat_ribbon.svg.png' },
  { country: 'Pakistan', branch: 'Pakistan Gallantry', name: 'Tamgha-e-Basalat (Medal of Valour)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Tamgha-e-Basalat.png/250px-Tamgha-e-Basalat.png' },
  { country: 'Pakistan', branch: 'Pakistan Gallantry', name: 'Tamgha-e-Diffa (Defence Medal)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Tamgha-e-Diffa_Pakistan.svg/250px-Tamgha-e-Diffa_Pakistan.svg.png' },
  { country: 'Pakistan', branch: 'Pakistan Long Service', name: '10 Years Service Medal', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/10_years_Service_Medal_%28Pakistan_Armed_Forces%29.png/250px-10_years_Service_Medal_%28Pakistan_Armed_Forces%29.png' },
  { country: 'Pakistan', branch: 'Pakistan Long Service', name: '20 Years Service Medal', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/20_years_Service_Medal_%28Pakistan_Armed_Forces%29.png/250px-20_years_Service_Medal_%28Pakistan_Armed_Forces%29.png' },
  { country: 'Pakistan', branch: 'Pakistan Long Service', name: '30 Years Service Medal', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/30_years_Service_Medal_%28Pakistan_Armed_Forces%29.png/250px-30_years_Service_Medal_%28Pakistan_Armed_Forces%29.png' },
  { country: 'Pakistan', branch: 'Pakistan Long Service', name: '35 Years Service Medal', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/35_years_Service_Medal_%28Pakistan_Armed_Forces%29.png/250px-35_years_Service_Medal_%28Pakistan_Armed_Forces%29.png' },
  { country: 'Pakistan', branch: 'Pakistan Long Service', name: '40 Years Service Medal', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/40_years_Service_Medal_%28Pakistan_Armed_Forces%29.png/250px-40_years_Service_Medal_%28Pakistan_Armed_Forces%29.png' },

  // ─── BELGIUM ─────────────────────────────────────────────────────────────────
  // Order of Leopold (military & civilian)
  { country: 'Belgium', branch: 'Belgium Orders', name: 'Order of Leopold - Grand Cordon', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/BEL_-_Order_of_Leopold_-_Grand_Cordon_bar.svg/250px-BEL_-_Order_of_Leopold_-_Grand_Cordon_bar.svg.png' },
  { country: 'Belgium', branch: 'Belgium Orders', name: 'Order of Leopold - Grand Officer', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/BEL_-_Order_of_Leopold_-_Grand_Officer_bar.svg/250px-BEL_-_Order_of_Leopold_-_Grand_Officer_bar.svg.png' },
  { country: 'Belgium', branch: 'Belgium Orders', name: 'Order of Leopold - Commander', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/BEL_-_Order_of_Leopold_-_Commander_bar.svg/250px-BEL_-_Order_of_Leopold_-_Commander_bar.svg.png' },
  { country: 'Belgium', branch: 'Belgium Orders', name: 'Order of Leopold - Officer', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/BEL_-_Order_of_Leopold_-_Officer_bar.svg/250px-BEL_-_Order_of_Leopold_-_Officer_bar.svg.png' },
  { country: 'Belgium', branch: 'Belgium Orders', name: 'Order of Leopold - Knight', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/BEL_-_Order_of_Leopold_-_Knight_bar.svg/250px-BEL_-_Order_of_Leopold_-_Knight_bar.svg.png' },
  // Order of Leopold II
  { country: 'Belgium', branch: 'Belgium Orders', name: 'Order of Leopold II - Grand Cross', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/BEL_Order_of_Leopold_II_-_Grand_Cross_BAR.svg/250px-BEL_Order_of_Leopold_II_-_Grand_Cross_BAR.svg.png' },
  { country: 'Belgium', branch: 'Belgium Orders', name: 'Order of Leopold II - Grand Officer', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/BEL_Order_of_Leopold_II_-_Grand_Officer_BAR.svg/250px-BEL_Order_of_Leopold_II_-_Grand_Officer_BAR.svg.png' },
  { country: 'Belgium', branch: 'Belgium Orders', name: 'Order of Leopold II - Commander', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/BEL_Order_of_Leopold_II_-_Commander_BAR.svg/250px-BEL_Order_of_Leopold_II_-_Commander_BAR.svg.png' },
  { country: 'Belgium', branch: 'Belgium Orders', name: 'Order of Leopold II - Officer', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/BEL_Order_of_Leopold_II_-_Officer_BAR.svg/250px-BEL_Order_of_Leopold_II_-_Officer_BAR.svg.png' },
  { country: 'Belgium', branch: 'Belgium Orders', name: 'Order of Leopold II - Knight', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/BEL_Order_of_Leopold_II_-_Knight_BAR.svg/250px-BEL_Order_of_Leopold_II_-_Knight_BAR.svg.png' },
  // Order of the Crown (Kroonorde)
  { country: 'Belgium', branch: 'Belgium Orders', name: 'Order of the Crown - Grand Cross', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/BEL_Kroonorde_Grootkruis_BAR.svg/250px-BEL_Kroonorde_Grootkruis_BAR.svg.png' },
  { country: 'Belgium', branch: 'Belgium Orders', name: 'Order of the Crown - Grand Officer', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/BEL_Kroonorde_Grootofficier_BAR.svg/250px-BEL_Kroonorde_Grootofficier_BAR.svg.png' },
  { country: 'Belgium', branch: 'Belgium Orders', name: 'Order of the Crown - Commander', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/BEL_Kroonorde_Commandeur_BAR.svg/250px-BEL_Kroonorde_Commandeur_BAR.svg.png' },
  { country: 'Belgium', branch: 'Belgium Orders', name: 'Order of the Crown - Officer', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/BEL_Kroonorde_Officier_BAR.svg/250px-BEL_Kroonorde_Officier_BAR.svg.png' },
  { country: 'Belgium', branch: 'Belgium Orders', name: 'Order of the Crown - Knight', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/BEL_Kroonorde_Ridder_BAR.svg/250px-BEL_Kroonorde_Ridder_BAR.svg.png' },
  // Gallantry
  { country: 'Belgium', branch: 'Belgium Gallantry', name: 'Military Cross - 2nd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/BEL_Militair_Kruis_2klasse_BAR.svg/250px-BEL_Militair_Kruis_2klasse_BAR.svg.png' },
  { country: 'Belgium', branch: 'Belgium Gallantry', name: 'Croix de Guerre 1954', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/BEL_Croix_de_Guerre_1954_ribbon.svg/250px-BEL_Croix_de_Guerre_1954_ribbon.svg.png' },

  // ─── ITALY ────────────────────────────────────────────────────────────────────
  // Orders
  { country: 'Italy', branch: 'Italy Orders', name: 'Order of Merit of the Italian Republic', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Cavaliere_OMRI_BAR.svg/250px-Cavaliere_OMRI_BAR.svg.png' },
  { country: 'Italy', branch: 'Italy Orders', name: 'Military Order of Italy', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Cavaliere_BAR.svg/250px-Cavaliere_BAR.svg.png' },
  { country: 'Italy', branch: 'Italy Orders', name: 'Order of the Star of Italy', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/StellaItalia-Cav.png/250px-StellaItalia-Cav.png' },
  { country: 'Italy', branch: 'Italy Orders', name: 'Order of Merit for Labour', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/1020px_ribbon_bar_of_the_Order_of_Merit_for_Labour.svg/250px-1020px_ribbon_bar_of_the_Order_of_Merit_for_Labour.svg.png' },
  // Gallantry
  { country: 'Italy', branch: 'Italy Gallantry', name: 'Medal of Military Valor - Gold', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Valor_militare_gold_medal_BAR.svg/250px-Valor_militare_gold_medal_BAR.svg.png' },
  { country: 'Italy', branch: 'Italy Gallantry', name: 'Medal of Military Valor - Silver', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Valor_militare_silver_medal_BAR.svg/250px-Valor_militare_silver_medal_BAR.svg.png' },
  { country: 'Italy', branch: 'Italy Gallantry', name: 'Medal of Military Valor - Bronze', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Valor_militare_bronze_medal_BAR.svg/250px-Valor_militare_bronze_medal_BAR.svg.png' },
  { country: 'Italy', branch: 'Italy Gallantry', name: 'War Cross for Military Valor', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Croce_di_guerra_al_valor_militare_BAR.svg/250px-Croce_di_guerra_al_valor_militare_BAR.svg.png' },
  { country: 'Italy', branch: 'Italy Service Medals', name: 'Medal of Valor of the Army', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Valor_dell%27esercito_gold_medal_BAR.svg/250px-Valor_dell%27esercito_gold_medal_BAR.svg.png' },
  { country: 'Italy', branch: 'Italy Service Medals', name: 'Medal of Valor of the Navy', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Valor_di_marina_medal_BAR.svg/250px-Valor_di_marina_medal_BAR.svg.png' },
  { country: 'Italy', branch: 'Italy Service Medals', name: 'Medal of Valor of the Air Forces', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Valor_aeronautico_medal_BAR.svg/250px-Valor_aeronautico_medal_BAR.svg.png' },

  // ─── NORWAY ───────────────────────────────────────────────────────────────────
  // Gallantry
  { country: 'Norway', branch: 'Norway Gallantry', name: 'War Cross with Sword', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Krigskorset_med_sverd_stripe.svg/250px-Krigskorset_med_sverd_stripe.svg.png' },
  { country: 'Norway', branch: 'Norway Gallantry', name: 'War Medal', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Krigsmedaljen_stripe.svg/250px-Krigsmedaljen_stripe.svg.png' },
  { country: 'Norway', branch: 'Norway Gallantry', name: 'Medal for Heroism in Gold', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Medaljen_for_edel_d%C3%A5d_stripe.svg/250px-Medaljen_for_edel_d%C3%A5d_stripe.svg.png' },
  { country: 'Norway', branch: 'Norway Gallantry', name: 'Armed Forces Medal for Heroic Deeds', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Forsvarets_medalje_for_edel_d%C3%A5d.svg/250px-Forsvarets_medalje_for_edel_d%C3%A5d.svg.png' },
  { country: 'Norway', branch: 'Norway Gallantry', name: 'Wounded in Action Medal', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Forsvarets_medalje_for_s%C3%A5rede_i_strid.svg/250px-Forsvarets_medalje_for_s%C3%A5rede_i_strid.svg.png' },
  // Orders
  { country: 'Norway', branch: 'Norway Orders', name: 'Royal Norwegian Order of St. Olav', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/St._Olavs_Orden_stripe.svg/250px-St._Olavs_Orden_stripe.svg.png' },
  { country: 'Norway', branch: 'Norway Orders', name: 'Royal Norwegian Order of Merit', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Den_kongelige_norske_fortjenstorden.svg/250px-Den_kongelige_norske_fortjenstorden.svg.png' },
  { country: 'Norway', branch: 'Norway Orders', name: 'Norwegian Defence Cross of Honour', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Forsvarets_hederskors_stripe.svg/250px-Forsvarets_hederskors_stripe.svg.png' },
  { country: 'Norway', branch: 'Norway Orders', name: 'King's Medal of Merit', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Kongens_fortjenstmedalje.svg/250px-Kongens_fortjenstmedalje.svg.png' },
  // Service Medals
  { country: 'Norway', branch: 'Norway Service Medals', name: 'Armed Forces Medal for International Operations', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Forsvarets_medalje_for_internasjonale_operasjoner_stripe.svg/250px-Forsvarets_medalje_for_internasjonale_operasjoner_stripe.svg.png' },
  { country: 'Norway', branch: 'Norway Service Medals', name: 'Army Medal of Merit', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/H%C3%A6rens_fortjenstmedalje_stripe.png/250px-H%C3%A6rens_fortjenstmedalje_stripe.png' },
  { country: 'Norway', branch: 'Norway Service Medals', name: 'Navy Medal of Merit', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Sj%C3%B8forsvarets_fortjenstmedalje_stripe.png/250px-Sj%C3%B8forsvarets_fortjenstmedalje_stripe.png' },
  { country: 'Norway', branch: 'Norway Service Medals', name: 'Air Force Medal of Merit', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Luftforsvarets_fortjenstmedalje_stripe.png/250px-Luftforsvarets_fortjenstmedalje_stripe.png' },
  { country: 'Norway', branch: 'Norway Service Medals', name: 'Intelligence Service Medal of Merit', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Etterretningstjenestens_fortjenstmedalje_stripe.png/250px-Etterretningstjenestens_fortjenstmedalje_stripe.png' },
  { country: 'Norway', branch: 'Norway Service Medals', name: 'Home Guard Medal of Merit', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Heimevernets_fortjenstmedalje_stripe.svg/250px-Heimevernets_fortjenstmedalje_stripe.svg.png' },
  // Long Service
  { country: 'Norway', branch: 'Norway Long Service', name: 'Defence Service Medal', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Forsvarsmedaljen_stripe.svg/250px-Forsvarsmedaljen_stripe.svg.png' },

  // ─── SWITZERLAND ─────────────────────────────────────────────────────────────
  { country: 'Switzerland', branch: 'Switzerland Long Service', name: 'Length of Service Decoration', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/CHE_Length_of_service_decoration.svg/250px-CHE_Length_of_service_decoration.svg.png' },
  { country: 'Switzerland', branch: 'Switzerland Service Medals', name: 'Exceptional Service Decoration', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/CHE_CdA_decoration.svg/250px-CHE_CdA_decoration.svg.png' },
  { country: 'Switzerland', branch: 'Switzerland Campaign Medals', name: 'Kosovo Mission Insignia (SWISSCOY)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/CHE_Operations_abroad_Kosovo_%28SWISSCOY%29.png/250px-CHE_Operations_abroad_Kosovo_%28SWISSCOY%29.png' },
  { country: 'Switzerland', branch: 'Switzerland Campaign Medals', name: 'Bosnia-Herzegovina Mission Insignia (OSCE)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/CHE_Operations_abroad_Bosnia-Herzegovina_%28SHQSU%29.png/250px-CHE_Operations_abroad_Bosnia-Herzegovina_%28SHQSU%29.png' },
  { country: 'Switzerland', branch: 'Switzerland Campaign Medals', name: 'Korea Mission Insignia (NNSC)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/CHE_Operations_abroad_Korea_%28NNSC%29.png/250px-CHE_Operations_abroad_Korea_%28NNSC%29.png' },
  { country: 'Switzerland', branch: 'Switzerland Campaign Medals', name: 'Western Sahara Mission Insignia (MINURSO)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/CHE_Operations_abroad_Western_Sahara_%28MINURSO%29.png/250px-CHE_Operations_abroad_Western_Sahara_%28MINURSO%29.png' },
  { country: 'Switzerland', branch: 'Switzerland Campaign Medals', name: 'Peace Support Mission Insignia', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/CHE_Operations_abroad_Peace_Support.png/250px-CHE_Operations_abroad_Peace_Support.png' },
  { country: 'Switzerland', branch: 'Switzerland Campaign Medals', name: 'UN Military Observer Mission Insignia', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/CHE_Operations_abroad_UN_Military_Observer.png/250px-CHE_Operations_abroad_UN_Military_Observer.png' },
  { country: 'Switzerland', branch: 'Switzerland Campaign Medals', name: 'Partnership for Peace Mission Insignia', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/CHE_Partnership_for_Peace_Mission_Insignia.png/250px-CHE_Partnership_for_Peace_Mission_Insignia.png' },

  // ─── LUXEMBOURG ──────────────────────────────────────────────────────────────
  { country: 'Luxembourg', branch: 'Luxembourg Orders', name: 'Order of Adolphe of Nassau - Grand Cross', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/LUX_Order_of_Adolphe_Nassau_Grand_Cross_BAR.png/250px-LUX_Order_of_Adolphe_Nassau_Grand_Cross_BAR.png' },
  { country: 'Luxembourg', branch: 'Luxembourg Orders', name: 'Order of Adolphe of Nassau - Grand Officer', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/LUX_Order_of_Adolphe_Nassau_Grand_Officer_BAR.png/250px-LUX_Order_of_Adolphe_Nassau_Grand_Officer_BAR.png' },
  { country: 'Luxembourg', branch: 'Luxembourg Orders', name: 'Order of Adolphe of Nassau - Commander', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/LUX_Order_of_Adolphe_Nassau_Commander_BAR.png/250px-LUX_Order_of_Adolphe_Nassau_Commander_BAR.png' },
  { country: 'Luxembourg', branch: 'Luxembourg Orders', name: 'Order of Adolphe of Nassau - Officer', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/LUX_Order_of_Adolphe_Nassau_Officer_BAR.png/250px-LUX_Order_of_Adolphe_Nassau_Officer_BAR.png' },
  { country: 'Luxembourg', branch: 'Luxembourg Orders', name: 'Order of Adolphe of Nassau - Knight', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/LUX_Order_of_Adolphe_Nassau_Knight_BAR.png/250px-LUX_Order_of_Adolphe_Nassau_Knight_BAR.png' },
  { country: 'Luxembourg', branch: 'Luxembourg Orders', name: 'Order of Merit of the Grand Duchy - Grand Cross', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/LUX_Ordre_de_M%C3%A9rite_du_Grand-Duch%C3%A9_de_Luxembourg_-_Grand%27Croix_BAR.svg/250px-LUX_Ordre_de_M%C3%A9rite_du_Grand-Duch%C3%A9_de_Luxembourg_-_Grand%27Croix_BAR.svg.png' },
  { country: 'Luxembourg', branch: 'Luxembourg Orders', name: 'Order of Merit of the Grand Duchy - Grand Officer', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/LUX_Ordre_de_M%C3%A9rite_du_Grand-Duch%C3%A9_de_Luxembourg_-_Grand-Officier_BAR.svg/250px-LUX_Ordre_de_M%C3%A9rite_du_Grand-Duch%C3%A9_de_Luxembourg_-_Grand-Officier_BAR.svg.png' },
  { country: 'Luxembourg', branch: 'Luxembourg Orders', name: 'Order of Merit of the Grand Duchy - Commander', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/LUX_Ordre_de_M%C3%A9rite_du_Grand-Duch%C3%A9_de_Luxembourg_-_Commandeur_BAR.svg/250px-LUX_Ordre_de_M%C3%A9rite_du_Grand-Duch%C3%A9_de_Luxembourg_-_Commandeur_BAR.svg.png' },
  { country: 'Luxembourg', branch: 'Luxembourg Orders', name: 'Order of Merit of the Grand Duchy - Officer', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/LUX_Ordre_de_M%C3%A9rite_du_Grand-Duch%C3%A9_de_Luxembourg_-_Officier_BAR.svg/250px-LUX_Ordre_de_M%C3%A9rite_du_Grand-Duch%C3%A9_de_Luxembourg_-_Officier_BAR.svg.png' },
  { country: 'Luxembourg', branch: 'Luxembourg Orders', name: 'Order of Merit of the Grand Duchy - Knight', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/LUX_Ordre_de_M%C3%A9rite_du_Grand-Duch%C3%A9_de_Luxembourg_-_Chevalier_BAR.svg/250px-LUX_Ordre_de_M%C3%A9rite_du_Grand-Duch%C3%A9_de_Luxembourg_-_Chevalier_BAR.svg.png' },
  { country: 'Luxembourg', branch: 'Luxembourg Service Medals', name: 'Military Medal', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/LUX_M%C3%A9daille_Militaire_BAR.svg/250px-LUX_M%C3%A9daille_Militaire_BAR.svg.png' },

  // ─── LITHUANIA ───────────────────────────────────────────────────────────────
  // Order of the Cross of Vytis (military order)
  { country: 'Lithuania', branch: 'Lithuania Orders', name: 'Order of the Cross of Vytis - Grand Cross', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/LTU_Order_of_the_Cross_of_Vytis_-_Grand_Cross_BAR.svg/250px-LTU_Order_of_the_Cross_of_Vytis_-_Grand_Cross_BAR.svg.png' },
  { country: 'Lithuania', branch: 'Lithuania Orders', name: 'Order of the Cross of Vytis - Commander's Grand Cross', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/LTU_Order_of_the_Cross_of_Vytis_-_Commander%27s_Grand_Cross_BAR.svg/250px-LTU_Order_of_the_Cross_of_Vytis_-_Commander%27s_Grand_Cross_BAR.svg.png' },
  { country: 'Lithuania', branch: 'Lithuania Orders', name: 'Order of the Cross of Vytis - Commander's Cross', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/LTU_Order_of_the_Cross_of_Vytis_-_Commander%27s_Cross_BAR.svg/250px-LTU_Order_of_the_Cross_of_Vytis_-_Commander%27s_Cross_BAR.svg.png' },
  { country: 'Lithuania', branch: 'Lithuania Orders', name: 'Order of the Cross of Vytis - Officer's Cross', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/LTU_Order_of_the_Cross_of_Vytis_-_Officer%27s_Cross_BAR.svg/250px-LTU_Order_of_the_Cross_of_Vytis_-_Officer%27s_Cross_BAR.svg.png' },
  { country: 'Lithuania', branch: 'Lithuania Orders', name: 'Order of the Cross of Vytis - Knight's Cross', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/LTU_Order_of_the_Cross_of_Vytis_-_Knight%27s_Cross_BAR.svg/250px-LTU_Order_of_the_Cross_of_Vytis_-_Knight%27s_Cross_BAR.svg.png' },
  { country: 'Lithuania', branch: 'Lithuania Orders', name: 'Order of the Cross of Vytis - Medal', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/LTU_Order_of_the_Cross_of_Vytis_-_Medal_BAR.svg/250px-LTU_Order_of_the_Cross_of_Vytis_-_Medal_BAR.svg.png' },
  // Order of Vytautas the Great
  { country: 'Lithuania', branch: 'Lithuania Orders', name: 'Order of Vytautas the Great - Grand Cross', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/LTU_Order_of_Vytautas_the_Great_-_Grand_Cross_BAR.svg/250px-LTU_Order_of_Vytautas_the_Great_-_Grand_Cross_BAR.svg.png' },
  { country: 'Lithuania', branch: 'Lithuania Orders', name: 'Order of Vytautas the Great - Commander's Grand Cross', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/LTU_Order_of_Vytautas_the_Great_-_Commander%27s_Grand_Cross_BAR.svg/250px-LTU_Order_of_Vytautas_the_Great_-_Commander%27s_Grand_Cross_BAR.svg.png' },
  { country: 'Lithuania', branch: 'Lithuania Orders', name: 'Order of Vytautas the Great - Commander's Cross', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/LTU_Order_of_Vytautas_the_Great_-_Commander%27s_Cross_BAR.svg/250px-LTU_Order_of_Vytautas_the_Great_-_Commander%27s_Cross_BAR.svg.png' },
  { country: 'Lithuania', branch: 'Lithuania Orders', name: 'Order of Vytautas the Great - Officer's Cross', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/LTU_Order_of_Vytautas_the_Great_-_Officer%27s_Cross_BAR.svg/250px-LTU_Order_of_Vytautas_the_Great_-_Officer%27s_Cross_BAR.svg.png' },
  { country: 'Lithuania', branch: 'Lithuania Orders', name: 'Order of Vytautas the Great - Knight's Cross', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/LTU_Order_of_Vytautas_the_Great_-_Knight%27s_Cross_BAR.svg/250px-LTU_Order_of_Vytautas_the_Great_-_Knight%27s_Cross_BAR.svg.png' },
  // Order for Merits to Lithuania
  { country: 'Lithuania', branch: 'Lithuania Orders', name: 'Order for Merits to Lithuania - Grand Cross', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/LTU_Order_for_Merits_to_Lithuania_-_Grand_Cross_BAR.svg/250px-LTU_Order_for_Merits_to_Lithuania_-_Grand_Cross_BAR.svg.png' },
  { country: 'Lithuania', branch: 'Lithuania Orders', name: 'Order for Merits to Lithuania - Commander's Grand Cross', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/LTU_Order_for_Merits_to_Lithuania_-_Commander%27s_Grand_Cross_BAR.svg/250px-LTU_Order_for_Merits_to_Lithuania_-_Commander%27s_Grand_Cross_BAR.svg.png' },
  { country: 'Lithuania', branch: 'Lithuania Orders', name: 'Order for Merits to Lithuania - Commander's Cross', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/LTU_Order_for_Merits_to_Lithuania_-_Commander%27s_Cross_BAR.svg/250px-LTU_Order_for_Merits_to_Lithuania_-_Commander%27s_Cross_BAR.svg.png' },
  { country: 'Lithuania', branch: 'Lithuania Orders', name: 'Order for Merits to Lithuania - Officer's Cross', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/LTU_Order_for_Merits_to_Lithuania_-_Officer%27s_Cross_BAR.svg/250px-LTU_Order_for_Merits_to_Lithuania_-_Officer%27s_Cross_BAR.svg.png' },
  { country: 'Lithuania', branch: 'Lithuania Orders', name: 'Order for Merits to Lithuania - Knight's Cross', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/LTU_Order_for_Merits_to_Lithuania_-_Knight%27s_Cross_BAR.svg/250px-LTU_Order_for_Merits_to_Lithuania_-_Knight%27s_Cross_BAR.svg.png' },
  // Service Medals
  { country: 'Lithuania', branch: 'Lithuania Service Medals', name: 'Armed Forces Medal of Merit', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/LTU_Armed_Forces_Medal_of_Merit_BAR.svg/250px-LTU_Armed_Forces_Medal_of_Merit_BAR.svg.png' },
  { country: 'Lithuania', branch: 'Lithuania Service Medals', name: 'Armed Forces Medal for Distinguished Service', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/LTU_Armed_Forces_Medal_for_Distinguished_Service_BAR.svg/250px-LTU_Armed_Forces_Medal_for_Distinguished_Service_BAR.svg.png' },
  { country: 'Lithuania', branch: 'Lithuania Service Medals', name: 'Armed Forces Medal for Injuries', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/LTU_Armed_Forces_Medal_for_Injuries_BAR.svg/250px-LTU_Armed_Forces_Medal_for_Injuries_BAR.svg.png' },
  { country: 'Lithuania', branch: 'Lithuania Service Medals', name: 'Armed Forces Medal for Contribution to Mutual Support', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/LTU_Armed_Forces_Medal_for_Contribution_to_Mutual_Support_BAR.svg/250px-LTU_Armed_Forces_Medal_for_Contribution_to_Mutual_Support_BAR.svg.png' },
  // Commemorative
  { country: 'Lithuania', branch: 'Lithuania Commemorative', name: 'Commemorative Medal of Accession to NATO', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/LTU_NDS_Commemorative_Medal_of_Accession_to_NATO_BAR.svg/250px-LTU_NDS_Commemorative_Medal_of_Accession_to_NATO_BAR.svg.png' },
  { country: 'Lithuania', branch: 'Lithuania Commemorative', name: 'Commemorative Medal of 13 January', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/LTU_Commemorative_Medal_of_13_January_BAR.svg/250px-LTU_Commemorative_Medal_of_13_January_BAR.svg.png' },

  // ─── LATVIA ───────────────────────────────────────────────────────────────────
  { country: 'Latvia', branch: 'Latvia Gallantry', name: 'Order of Lacplesis (Military Order)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Lacplesis_Military_Order_Ribbon.png/250px-Lacplesis_Military_Order_Ribbon.png' },
  { country: 'Latvia', branch: 'Latvia Orders', name: 'Order of the Three Stars - Grand Cross', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Order_of_the_Three_Stars_Grand_Cross_BAR_%28Latvia%29.png/250px-Order_of_the_Three_Stars_Grand_Cross_BAR_%28Latvia%29.png' },
  { country: 'Latvia', branch: 'Latvia Orders', name: 'Order of the Three Stars - Commander', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/LVA_Order_of_the_Three_Stars_-_Commander_BAR.png/250px-LVA_Order_of_the_Three_Stars_-_Commander_BAR.png' },
  { country: 'Latvia', branch: 'Latvia Orders', name: 'Order of the Three Stars - Gold Medal', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/LVA_Order_of_the_Three_Stars_-_Gold_Medal_BAR.png/250px-LVA_Order_of_the_Three_Stars_-_Gold_Medal_BAR.png' },
  { country: 'Latvia', branch: 'Latvia Orders', name: 'Order of the Three Stars - Silver Medal', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/LVA_Order_of_the_Three_Stars_-_Silver_Medal_BAR.png/250px-LVA_Order_of_the_Three_Stars_-_Silver_Medal_BAR.png' },
  { country: 'Latvia', branch: 'Latvia Orders', name: 'Order of the Three Stars - Bronze Medal', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/LVA_Order_of_the_Three_Stars_-_Bronze_Medal_BAR.png/250px-LVA_Order_of_the_Three_Stars_-_Bronze_Medal_BAR.png' },

  // ─── CHINA (PLA) ─────────────────────────────────────────────────────────────
  // Highest Orders (wartime)
  { country: 'China', branch: 'China Gallantry', name: 'Order of the Red Banner', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/PLA_honour_ribbon_order_of_red_banner.svg/250px-PLA_honour_ribbon_order_of_red_banner.svg.png' },
  { country: 'China', branch: 'China Gallantry', name: 'Order of the Red Star', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/PLA_honour_ribbon_order_of_red_star.svg/250px-PLA_honour_ribbon_order_of_red_star.svg.png' },
  // Wartime Honorary Titles
  { country: 'China', branch: 'China Gallantry', name: 'Wartime Honorary Title - Special Class Combat Hero', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/PLA_honour_ribbon_honorary_title_individual_wartime_lv1.svg/250px-PLA_honour_ribbon_honorary_title_individual_wartime_lv1.svg.png' },
  { country: 'China', branch: 'China Gallantry', name: 'Wartime Honorary Title - 1st Class Combat Hero', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/PLA_honour_ribbon_honorary_title_individual_wartime_lv2.svg/250px-PLA_honour_ribbon_honorary_title_individual_wartime_lv2.svg.png' },
  { country: 'China', branch: 'China Gallantry', name: 'Wartime Honorary Title - 2nd Class Combat Hero', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/PLA_honour_ribbon_honorary_title_individual_wartime_lv3.svg/250px-PLA_honour_ribbon_honorary_title_individual_wartime_lv3.svg.png' },
  // Wartime Meritorious Service Medals
  { country: 'China', branch: 'China Gallantry', name: 'Wartime Meritorious Service Medal - 1st Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/PLA_honour_ribbon_meritorious_service_medal_individual_wartime_lv1.svg/250px-PLA_honour_ribbon_meritorious_service_medal_individual_wartime_lv1.svg.png' },
  { country: 'China', branch: 'China Gallantry', name: 'Wartime Meritorious Service Medal - 2nd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/PLA_honour_ribbon_meritorious_service_medal_individual_wartime_lv2.svg/250px-PLA_honour_ribbon_meritorious_service_medal_individual_wartime_lv2.svg.png' },
  { country: 'China', branch: 'China Gallantry', name: 'Wartime Meritorious Service Medal - 3rd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/PLA_honour_ribbon_meritorious_service_medal_individual_wartime_lv3.svg/250px-PLA_honour_ribbon_meritorious_service_medal_individual_wartime_lv3.svg.png' },
  { country: 'China', branch: 'China Gallantry', name: 'Wartime Meritorious Service Medal - 4th Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/PLA_honour_ribbon_meritorious_service_medal_individual_wartime_lv4.svg/250px-PLA_honour_ribbon_meritorious_service_medal_individual_wartime_lv4.svg.png' },
  // Medal of Valor
  { country: 'China', branch: 'China Gallantry', name: 'Medal of Valor (Combat Disabled)', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/PLA_service_ribbon_bravery.svg/250px-PLA_service_ribbon_bravery.svg.png' },
  // Peacetime Meritorious Service Medals
  { country: 'China', branch: 'China Service Medals', name: 'Peacetime Meritorious Service Medal - 1st Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PLA_honour_ribbon_meritorious_service_medal_individual_peacetime_lv1.svg/250px-PLA_honour_ribbon_meritorious_service_medal_individual_peacetime_lv1.svg.png' },
  { country: 'China', branch: 'China Service Medals', name: 'Peacetime Meritorious Service Medal - 2nd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/PLA_honour_ribbon_meritorious_service_medal_individual_peacetime_lv2.svg/250px-PLA_honour_ribbon_meritorious_service_medal_individual_peacetime_lv2.svg.png' },
  { country: 'China', branch: 'China Service Medals', name: 'Peacetime Meritorious Service Medal - 3rd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/PLA_honour_ribbon_meritorious_service_medal_individual_peacetime_lv3.svg/250px-PLA_honour_ribbon_meritorious_service_medal_individual_peacetime_lv3.svg.png' },
  // Commendations
  { country: 'China', branch: 'China Service Medals', name: 'Individual Commendation - 1st Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/PLA_honour_ribbon_commendation_for_individual_lv1.svg/250px-PLA_honour_ribbon_commendation_for_individual_lv1.svg.png' },
  { country: 'China', branch: 'China Service Medals', name: 'Individual Commendation - 2nd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/PLA_honour_ribbon_commendation_for_individual_lv2.svg/250px-PLA_honour_ribbon_commendation_for_individual_lv2.svg.png' },
  { country: 'China', branch: 'China Service Medals', name: 'Individual Commendation - 3rd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/PLA_honour_ribbon_commendation_for_individual_lv3.svg/250px-PLA_honour_ribbon_commendation_for_individual_lv3.svg.png' },
  // Branch Honour Awards
  { country: 'China', branch: 'China Service Medals', name: 'Navy Iron Shield Honour - 1st Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Navy_honour_ribbon_lv1.svg/250px-Navy_honour_ribbon_lv1.svg.png' },
  { country: 'China', branch: 'China Service Medals', name: 'Navy Iron Shield Honour - 2nd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Navy_honour_ribbon_lv2.svg/250px-Navy_honour_ribbon_lv2.svg.png' },
  { country: 'China', branch: 'China Service Medals', name: 'Navy Iron Shield Honour - 3rd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Navy_honour_ribbon_lv3.svg/250px-Navy_honour_ribbon_lv3.svg.png' },
  { country: 'China', branch: 'China Service Medals', name: 'Air Force Sky and Space Iron Fist Honour - 1st Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/AF_honour_ribbon_lv1.svg/250px-AF_honour_ribbon_lv1.svg.png' },
  { country: 'China', branch: 'China Service Medals', name: 'Air Force Sky and Space Iron Fist Honour - 2nd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/AF_honour_ribbon_lv2.svg/250px-AF_honour_ribbon_lv2.svg.png' },
  { country: 'China', branch: 'China Service Medals', name: 'Air Force Sky and Space Iron Fist Honour - 3rd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/AF_honour_ribbon_lv3.svg/250px-AF_honour_ribbon_lv3.svg.png' },
  { country: 'China', branch: 'China Service Medals', name: 'Rocket Force Sharpening Sword Vanguard Honour - 1st Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/RF_honour_ribbon_lv1.svg/250px-RF_honour_ribbon_lv1.svg.png' },
  { country: 'China', branch: 'China Service Medals', name: 'Rocket Force Sharpening Sword Vanguard Honour - 2nd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/RF_honour_ribbon_lv2.svg/250px-RF_honour_ribbon_lv2.svg.png' },
  { country: 'China', branch: 'China Service Medals', name: 'Rocket Force Sharpening Sword Vanguard Honour - 3rd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/RF_honour_ribbon_lv3.svg/250px-RF_honour_ribbon_lv3.svg.png' },
  // Service Branch Ribbons
  { country: 'China', branch: 'China Service Medals', name: 'PLA Ground Force Service Ribbon', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/PLA_service_ribbon_ground_force.svg/250px-PLA_service_ribbon_ground_force.svg.png' },
  { country: 'China', branch: 'China Service Medals', name: 'PLA Navy Service Ribbon', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/PLA_service_ribbon_navy.svg/250px-PLA_service_ribbon_navy.svg.png' },
  { country: 'China', branch: 'China Service Medals', name: 'PLA Air Force Service Ribbon', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/PLA_service_ribbon_air_force.svg/250px-PLA_service_ribbon_air_force.svg.png' },
  { country: 'China', branch: 'China Service Medals', name: 'PLA Rocket Force Service Ribbon', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/PLA_service_ribbon_rocket_force.svg/250px-PLA_service_ribbon_rocket_force.svg.png' },
  { country: 'China', branch: 'China Service Medals', name: 'Joint Logistics Support Force Service Ribbon', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/PLA_service_ribbon_joint_logistics_support_force.svg/250px-PLA_service_ribbon_joint_logistics_support_force.svg.png' },
  // Campaign / Operational Ribbons
  { country: 'China', branch: 'China Campaign Medals', name: 'Combat Experience Ribbon', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/PLA_service_ribbon_combat_mission.svg/250px-PLA_service_ribbon_combat_mission.svg.png' },
  { country: 'China', branch: 'China Campaign Medals', name: 'Major MOOTW Experience Ribbon', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/PLA_service_ribbon_vital_MOOTW.svg/250px-PLA_service_ribbon_vital_MOOTW.svg.png' },
  { country: 'China', branch: 'China Campaign Medals', name: 'Overseas Deployment Ribbon - 1st Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/PLA_service_ribbon_overseas_deployment_lv1.svg/250px-PLA_service_ribbon_overseas_deployment_lv1.svg.png' },
  { country: 'China', branch: 'China Campaign Medals', name: 'Overseas Deployment Ribbon - 2nd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/PLA_service_ribbon_overseas_deployment_lv2.svg/250px-PLA_service_ribbon_overseas_deployment_lv2.svg.png' },
  { country: 'China', branch: 'China Campaign Medals', name: 'Overseas Deployment Ribbon - 3rd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/PLA_service_ribbon_overseas_deployment_lv3.svg/250px-PLA_service_ribbon_overseas_deployment_lv3.svg.png' },
  { country: 'China', branch: 'China Campaign Medals', name: 'Border Defence Service Ribbon - 1st Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/PLA_service_ribbon_medal_of_defending_the_frontiers_lv1.svg/250px-PLA_service_ribbon_medal_of_defending_the_frontiers_lv1.svg.png' },
  { country: 'China', branch: 'China Campaign Medals', name: 'Border Defence Service Ribbon - 2nd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/PLA_service_ribbon_medal_of_defending_the_frontiers_lv2.svg/250px-PLA_service_ribbon_medal_of_defending_the_frontiers_lv2.svg.png' },
  { country: 'China', branch: 'China Campaign Medals', name: 'Border Defence Service Ribbon - 3rd Class', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/PLA_service_ribbon_medal_of_defending_the_frontiers_lv3.svg/250px-PLA_service_ribbon_medal_of_defending_the_frontiers_lv3.svg.png' },
];