import {
  CONSTRUCTION_AGE_STATUS,
  ELIGIBILITY_STATUS,
  HEATING_SYSTEM,
  HOUSING_STATUS,
  HOUSE_SURFACE_STATUS,
  RFR_TRANCHE,
  type EligibilityAnswersInput,
  type EligibilityEvaluation,
  type EligibleProduct,
  type HeatingSystem,
  type RequiredDocumentType,
} from "./eligibility.types";

const eligibleHeatingSystems = new Set<HeatingSystem>([
  HEATING_SYSTEM.OIL_BOILER,
  HEATING_SYSTEM.GAS_BOILER,
  HEATING_SYSTEM.WOOD_BOILER,
  HEATING_SYSTEM.PELLET_BOILER,
  HEATING_SYSTEM.PAC_BEFORE_2023,
]);

const ownerDocuments: RequiredDocumentType[] = [
  "avis_imposition",
  "taxe_habitation",
  "taxe_fonciere",
  "piece_identite",
  "photo_chaudiere",
  "photo_compteur_electrique",
];

const tenantDocuments: RequiredDocumentType[] = [
  "avis_imposition",
  "justificatif_domicile",
  "piece_identite",
  "bail_location",
];

export class MaPrimeRenovEligibilityService {
  evaluate(answers: EligibilityAnswersInput): EligibilityEvaluation {
    const reasons: string[] = [];

    if (answers.housing_status === HOUSING_STATUS.TENANT) {
      reasons.push("Le prospect est locataire.");
    }

    if (
      answers.construction_age_status ===
      CONSTRUCTION_AGE_STATUS.LESS_THAN_15_YEARS
    ) {
      reasons.push("Le logement a moins de 15 ans.");
    }

    if (answers.house_surface_status === HOUSE_SURFACE_STATUS.OUTSIDE_RANGE) {
      reasons.push("La surface n'est pas comprise entre 50 m2 et 350 m2.");
    }

    if (
      answers.heating_system &&
      !eligibleHeatingSystems.has(answers.heating_system)
    ) {
      reasons.push("Le systeme de chauffage actuel n'est pas eligible.");
    }

    if (answers.rfr_tranche === RFR_TRANCHE.ABOVE) {
      reasons.push("Le revenu fiscal est au-dessus du plafond.");
    }

    const eligibleProducts = this.getEligibleProducts(answers);

    if (!eligibleProducts.length) {
      reasons.push("Les informations techniques sont insuffisantes.");
    }

    return {
      eligibility_status: reasons.length
        ? reasons.length === 1 &&
          reasons[0] === "Les informations techniques sont insuffisantes."
          ? ELIGIBILITY_STATUS.INCOMPLETE
          : ELIGIBILITY_STATUS.NON_ELIGIBLE
        : ELIGIBILITY_STATUS.ELIGIBLE,
      non_eligibility_reasons: reasons,
      eligible_products: eligibleProducts,
      required_documents: this.getRequiredDocuments(answers, eligibleProducts),
    };
  }

  private getEligibleProducts(answers: EligibilityAnswersInput): EligibleProduct[] {
    const products: EligibleProduct[] = [];

    if (answers.has_pac_space) {
      products.push("PAC seule" as const);
    }

    if (answers.has_pac_space && answers.has_balloon_space) {
      products.push("PAC + BS" as const, "PAC + BE" as const, "PAC + BT" as const);
    }

    if (answers.has_pac_space && answers.has_roof_space) {
      products.push("PAC + SSC" as const);
    }

    if (answers.has_roof_space) {
      products.push("SSC seul" as const);
    }

    return products;
  }

  private getRequiredDocuments(
    answers: EligibilityAnswersInput,
    eligibleProducts: string[],
  ): RequiredDocumentType[] {
    const documents =
      answers.housing_status === HOUSING_STATUS.TENANT
        ? [...tenantDocuments]
        : [...ownerDocuments];

    if (eligibleProducts.some((product) => product.includes("SSC"))) {
      documents.push("photo_toit");
    }

    return [...new Set(documents)];
  }
}
