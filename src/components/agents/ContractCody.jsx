import React from "react";
import { stripThinking } from "../../utils/helpers";

// ─── CODY CONSTANTS ─────────────────────────────────────────────────────────
const CT_FONT = "'Avenir','Avenir Next','Nunito Sans',sans-serif";
const CT_LS = 0.5; const CT_LS_HDR = 1.5;
const getToken = () => localStorage.getItem("onna_token") || "";

// ─── CODY (CONTRACT) HELPERS ────────────────────────────────────────────────
const CONTRACT_INIT = {
  contractType:"commission_se",
  fieldValues:{},
  generalTermsEdits:{},
  sigNames:{},
  signatures:{},
  prodLogo:null,
  signingStatus:"not_sent",
  signingToken:null,
  fieldConfirmed:{},
};

// Migrate old-format contract (activeType + prefixed keys) → new format (contractType + bare keys)
function migrateContract(c) {
  if (!c.activeType) return c; // already new format or no migration needed
  const ct = c.activeType;
  const next = { ...c, contractType: ct };
  delete next.activeType;
  // Strip type prefix from fieldValues
  if (c.fieldValues) {
    const fv = {};
    Object.entries(c.fieldValues).forEach(([k, v]) => {
      if (k.startsWith(ct + "_")) fv[k.slice(ct.length + 1)] = v;
      else fv[k] = v;
    });
    next.fieldValues = fv;
  }
  // Strip type prefix from sigNames
  if (c.sigNames) {
    const sn = {};
    Object.entries(c.sigNames).forEach(([k, v]) => {
      if (k.startsWith(ct + "_")) sn[k.slice(ct.length + 1)] = v;
      else sn[k] = v;
    });
    next.sigNames = sn;
  }
  // Strip type prefix from signatures
  if (c.signatures) {
    const sg = {};
    Object.entries(c.signatures).forEach(([k, v]) => {
      if (k.startsWith(ct + "_")) sg[k.slice(ct.length + 1)] = v;
      else sg[k] = v;
    });
    next.signatures = sg;
  }
  // Strip type prefix from generalTermsEdits — keep only the active type's value
  if (c.generalTermsEdits && c.generalTermsEdits[ct]) {
    next.generalTermsEdits = { custom: c.generalTermsEdits[ct] };
  } else {
    next.generalTermsEdits = {};
  }
  if (!next.signingStatus) next.signingStatus = "not_sent";
  if (!next.signingToken) next.signingToken = null;
  return next;
}

const CONTRACT_TYPE_IDS = ["commission_se","commission_psc","talent","talent_psc"];
const CONTRACT_TYPE_LABELS = {"commission_se":"Commissioning Agreement (Self-Employed)","commission_psc":"Commissioning Agreement (Via PSC)","talent":"Talent Agreement","talent_psc":"Talent Agreement (Via PSC)"};

const CONTRACT_FIELDS = {
  commission_se:["date","client","commissioner","commissionee","content","deadline","fee","usage","special"],
  commission_psc:["date","client","commissioner","commissionee","content","deadline","fee","usage","special"],
  talent:["date","brand","brandRep","agency","talent","campaign","services","venue","content","usage","fee","invoicing","special"],
  talent_psc:["date","brand","brandRep","agency","psc","talent","campaign","services","venue","content","usage","fee","invoicing","special"],
};

const CONTRACT_DOC_TYPES = [
  { id: "commission_se", label: "Commissioning Agreement (Self-Employed)", short: "Commission (SE)",
    title: "COMMISSIONING AGREEMENT", headTermsLabel: "HEAD TERMS",
    fields: [
      { key: "date", label: "Commencement Date", defaultValue: "[Date]" },
      { key: "client", label: "Client", defaultValue: "[Name of Company] a company registered in [Country] under number [License Number] whose registered office is at [Address]" },
      { key: "commissioner", label: "Commissioner", defaultValue: "ONNA FILM, TV & RADIO PRODUCTION SERVICES L.L.C Trading as ONNA, a company registered in The United Arab Emirates under license number 1541190 whose registered office is at OFFICE NO. F1-022, PROPERTY INVESTMENT OFFICE 4-F1 DUBAI UNITED ARAB EMIRATES" },
      { key: "commissionee", label: "Commissionee", defaultValue: "[Insert full name and address]" },
      { key: "content", label: "Commissioned Content (including out-takes)", defaultValue: "[Name of Shoot]\nAttend the [Name of Shoot] as [Role] on [Date] to [Scope of work]\n[Additional Scope of work]\n\nAll the products of Commissionee's services under this Agreement, including but not limited to all photographic images, video and audio in whatever form taken or to be taken by the Commissionee or the Commissionee's employees, agents or representatives, including any reproductions, extracts and adaptations and including retouched and post-production versions of such images, are included in the Commissioned Content." },
      { key: "deadline", label: "Deadline for Submission", defaultValue: "[Date of delivery]" },
      { key: "fee", label: "Fee", defaultValue: "[Fee] broken down as follows:\n\nIf the Commissionee fails to attend the Shoot or seeks to terminate his/her involvement in the Campaign for any reason, or if ONNA terminates this Agreement under clause 10 of the General Conditions, the Fee shall not be payable (and any portion of the Fee already paid by the ONNA shall be refunded accordingly).\n\nIf the Commissionee is more than one (1) hour late for the Shoot, or fails to stay for the shoot duration, Commissioner may at its option: (i) pay the Commissionee a pro-rated portion of the Fee; or (ii) agree that the Commissionee shall make up the lost time at the end of the Shoot or attend an additional shoot on an alternative date agreed by the Commissioner at its sole discretion." },
      { key: "usage", label: "Usage", defaultValue: "[Usage]" },
      { key: "special", label: "Special Terms", defaultValue: "The Commissionee agrees to keep all details of the Campaign confidential which, for the avoidance of doubt, shall include refraining from posting anything about the Campaign without the written approval of the Commissioner." },
    ],
    sigLeft: "Signed by an authorised representative for and on behalf of ONNA",
    sigRight: "Signed by the Commissionee",
  },
  { id: "commission_psc", label: "Commissioning Agreement (Via PSC)", short: "Commission (PSC)",
    title: "COMMISSIONING AGREEMENT", headTermsLabel: "HEAD TERMS",
    fields: [
      { key: "date", label: "Commencement Date", defaultValue: "[Date]" },
      { key: "client", label: "Client", defaultValue: "[Name of Company] a company registered in [Country] under number [License Number] whose registered office is at [Address]" },
      { key: "commissioner", label: "Commissioner", defaultValue: "ONNA FILM, TV & RADIO PRODUCTION SERVICES L.L.C Trading as ONNA, a company registered in The United Arab Emirates under license number 1541190 whose registered office is at OFFICE NO. F1-022, PROPERTY INVESTMENT OFFICE 4-F1 DUBAI UNITED ARAB EMIRATES" },
      { key: "commissionee", label: "Commissionee", defaultValue: "[Name of Company] a company registered in [Country] under number [License Number] whose registered office is at [Address]\nFor the services of [Full name and address] (the \"Individual\")" },
      { key: "content", label: "Commissioned Content (including out-takes)", defaultValue: "[Name of Shoot]\nAttend the [Name of Shoot] as [Role] on [Date] to [Scope of work]\n[Additional Scope of work]\n\nAll the products of Commissionee's and Individual's services under this Agreement, including but not limited to all photographic images, video and audio in whatever form taken or to be taken by the Commissionee or the Commissionee's employees, agents or representatives, including any reproductions, extracts and adaptations and including retouched and post-production versions of such images, are included in the Commissioned Content." },
      { key: "deadline", label: "Deadline for Submission", defaultValue: "[Date of delivery]" },
      { key: "fee", label: "Fee", defaultValue: "[Fee] broken down as follows:\n\nIf the Individual fails to attend the Shoot or seeks to terminate his/her involvement in the Campaign for any reason, or if ONNA terminates this Agreement under clause 10 of the General Conditions, the Fee shall not be payable (and any portion of the Fee already paid by the ONNA shall be refunded accordingly).\n\nIf the Individual is more than one (1) hour late for the Shoot, or fails to stay for the shoot duration, Commissioner may at its option: (i) pay the Commissionee a pro-rated portion of the Fee; or (ii) agree that the Individual shall make up the lost time at the end of the Shoot or attend an additional shoot on an alternative date agreed by the Commissioner at its sole discretion." },
      { key: "usage", label: "Usage", defaultValue: "[Usage]" },
      { key: "special", label: "Special Terms", defaultValue: "The Commissionee agrees to keep all details of the Campaign confidential which, for the avoidance of doubt, shall include refraining from posting anything about the Campaign without the written approval of the Commissioner." },
    ],
    sigLeft: "Signed by an authorised representative for and on behalf of ONNA",
    sigRight: "Signed by an authorised representative for and on behalf of Commissionee",
  },
  { id: "talent", label: "Talent Agreement", short: "Talent",
    title: "TALENT AGREEMENT - COMMERCIAL TERMS", headTermsLabel: "COMMERCIAL TERMS",
    fields: [
      { key: "date", label: "Commencement Date", defaultValue: "[Date]" },
      { key: "brand", label: "Brand", defaultValue: "[Name of Company] a company registered in [Country] under number [License Number] whose registered office is at [Address]" },
      { key: "brandRep", label: "Brand Representative", defaultValue: "Name: [Client Name] Email: [Client Email] Telephone: [Client Mobile]" },
      { key: "agency", label: "Agency", defaultValue: "ONNA FILM, TV & RADIO PRODUCTION SERVICES L.L.C Trading as ONNA, a company registered in The United Arab Emirates under license number 1541190 whose registered office is at OFFICE NO. F1-022, PROPERTY INVESTMENT OFFICE 4-F1 DUBAI UNITED ARAB EMIRATES" },
      { key: "talent", label: "Talent", defaultValue: "[Name] whose address is at [Address]\nName: [Talent Name]\nEmail: [Talent Email] Telephone: [Talent Mobile]\nAgent (if applicable): [Company] (the \"Agent\")" },
      { key: "campaign", label: "Campaign", defaultValue: "[Name of Shoot]" },
      { key: "services", label: "Services", defaultValue: "Shoot Date: [DATE]\nShoot Duration: [HOURS] (inclusive)\nAdditional PR Services: [Details]" },
      { key: "venue", label: "Venue", defaultValue: "[Address]" },
      { key: "content", label: "Content", defaultValue: "Any content created, combined, edited or otherwise captured by the Brand, Agency or Talent for the purposes of promoting the Campaign." },
      { key: "usage", label: "Usage", defaultValue: "[Usage Terms]" },
      { key: "fee", label: "Fee", defaultValue: "[Fee]" },
      { key: "invoicing", label: "Invoicing Terms", defaultValue: "It is acknowledged that the Talent has nominated his/her Agent to issue the invoice for the Fee on his/her behalf." },
      { key: "special", label: "Special Terms", defaultValue: "The Talent agrees to keep all details of the Campaign confidential." },
    ],
    sigLeft: "Signed by an authorised representative for and on behalf of ONNA",
    sigRight: "Signed by the Talent",
  },
  { id: "talent_psc", label: "Talent Agreement (Via PSC)", short: "Talent (PSC)",
    title: "TALENT AGREEMENT VIA PSC - COMMERCIAL TERMS", headTermsLabel: "COMMERCIAL TERMS",
    fields: [
      { key: "date", label: "Commencement Date", defaultValue: "[Date]" },
      { key: "brand", label: "Brand", defaultValue: "[Name of Company] a company registered in [Country] under number [License Number] whose registered office is at [Address]" },
      { key: "brandRep", label: "Brand Representative", defaultValue: "Name: [Client Name] Email: [Client Email] Telephone: [Client Mobile]" },
      { key: "agency", label: "Agency", defaultValue: "ONNA FILM, TV & RADIO PRODUCTION SERVICES L.L.C Trading as ONNA, a company registered in The United Arab Emirates under license number 1541190 whose registered office is at OFFICE NO. F1-022, PROPERTY INVESTMENT OFFICE 4-F1 DUBAI UNITED ARAB EMIRATES" },
      { key: "psc", label: "Loanout/Personal Services Company (the \"PSC\")", defaultValue: "[Talent Company Name]; a company registered in [Country] under number [License Number] whose registered office is at [Address]" },
      { key: "talent", label: "Talent", defaultValue: "[Name] whose address is at [Address]\nName: [Talent Name]\nEmail: [Talent Email] Telephone: [Talent Mobile]\nAgent (if applicable): [Company] (the \"Agent\")" },
      { key: "campaign", label: "Campaign", defaultValue: "[Name of Shoot]" },
      { key: "services", label: "Services", defaultValue: "Shoot Date: [DATE]\nShoot Duration: [HOURS] (inclusive)\nAdditional PR Services: [Details]" },
      { key: "venue", label: "Venue", defaultValue: "[Address]" },
      { key: "content", label: "Content", defaultValue: "Any content created, combined, edited or otherwise captured by the Brand, Agency or Talent for the purposes of promoting the Campaign." },
      { key: "usage", label: "Usage", defaultValue: "[Usage Terms]" },
      { key: "fee", label: "Fee", defaultValue: "[Fee]" },
      { key: "invoicing", label: "Invoicing Terms", defaultValue: "It is acknowledged that the Talent has nominated his/her Agent to issue the invoice for the Fee on his/her behalf." },
      { key: "special", label: "Special Terms", defaultValue: "The PSC shall procure that the Talent agrees to keep all details of the Campaign confidential." },
    ],
    sigLeft: "Signed by an authorised representative for and on behalf of ONNA",
    sigRight: "Signed by an authorised representative for and on behalf of the PSC",
  },
];

export const GENERAL_TERMS_DOC = {
  commission_se: `GENERAL TERMS

These General Terms together with the Head Terms above constitute an agreement (the "Agreement") under which the Commissionee agrees to provide the Services to the the Commissioner. The parties hereby accept and agree to be bound by the terms set out in this Agreement. Should there be any conflict between the Head Terms and the General Terms, the Head Terms shall prevail.

IT IS AGREED AS FOLLOWS:

The Commissionee agrees to create and supply the Commissioned Content to the Commissioner (the Services) by the Deadline for Submission, in relation to which, time is of the essence. The Commissionee will perform the Services in a diligent and professional manner, in accordance with applicable law and with the Commissioner's reasonable instructions (including any agreed briefing document). The Commissionee will liaise with, and report to, the Commissioner in such manner as the Commissioner may reasonably require to ensure the Commissioner is appraised of the progress of the Services.

The Commissionee irrevocably and unconditionally assign to us Commissioner of all third party rights, claims and encumbrances and, without prejudice to the foregoing, with full title guarantee and where the assignment is of copyright by way of assignment of present and future copyright, all of Commissionee's rights, title and interests of whatsoever nature (whether now or hereafter known or created and whether vested or contingent) in and to the entire copyright in the Commissioned Content (including all rights in the nature of copyright and all neighbouring rights relating to the Commissioned Content including without limitation any rental and lending rights and the right to communicate to the public) and in and to the Commissioned Content for Commissionee to hold the same absolutely, throughout the world, for the full period of such rights wherever subsisting or acquired and all renewals, reversions, revivals and extensions of such rights and thereafter (insofar as is or may become possible) in perpetuity. The Commissionee unconditionally and irrevocably waives in favour of the Commissioner all moral rights in or relating to the Commissioned Content arising under the Copyright, Designs and Patents Act 1988 and, so far as is legally possible, any broadly equivalent rights in any territory of the world. Should the Commissioner or the Client's usage of the Commissioned Content be limited by the Head Terms of this Agreement, Commissioner agrees that it will not, and it will not authorize the Client to exceed these Usage limitations.

The Commissioner agrees that the Commissionee may use the Commissioned Content for portfolio purposes to promote his/her catalogue of work in print, digital or online platforms. Any such use is subject to the prior written approval of the Commissioner, which will not unreasonably be withheld, but which will not extend to: i) any use prior to first use by the Commissioner ii) any use which implies any relationship with the Commissioner beyond that set out in this Agreement.

Payment Terms:

In consideration of the supply and assignment of the Commissioned Content by the Commissionee, the Commissioner shall pay to the Commissionee the Fee. No expenses or disbursements incurred by the Commissionee shall be payable by the Commissioner unless agreed by the Commissioner in writing in advance. The Commissionee may invoice the Commissioner at any time after delivery of the Commissioned Content to the Commissioner and the Commissioner shall pay each invoice which is properly due within 60 days of the date on which the invoice is received.

Unless otherwise indicated in the Head Terms, the Fee is exclusive of VAT, which, if applicable, the Commissionee shall add to its invoices at the appropriate rate.

The Commissioner shall have the right to deduct and withhold from any payments due to the Commissionee all withholding and/or other taxes, contributions, or other payments required to be deducted, withheld, or paid by the Commissioner per any applicable present or future law or governmental rule or regulation. If the Commissioner does not deduct or withhold such taxes or other payments, the Commissionee shall immediately pay (whether on demand to the Commissioner or to the relevant authority) any and all such taxes, contributions, or other payments, together with all penalties, charges, and interest relating to the foregoing, and the Commissionee indemnifies the Commissioner and shall keep the Commissioner fully and effectually indemnified from and against any liability or expense in connection with such taxes or other payments (save to the extent that such recovery is prohibited by law).

If: (i) the Commissioner makes any payment or incurs any charge at the Commissionee's request for the Commissionee's account (which the Commissioner is not obliged to do); or (ii) the Commissionee incurs any charges with the Commissioner, causes any damage to the Commissioner's materials, property, or accommodation, or causes the Commissioner to incur or bear any costs in connection with the Commissionee losing, or failing to return on request, the Commissioner's property or third-party property for which the Commissioner has financial responsibility (e.g., a security pass, vehicle-associated penalties); the Commissioner shall have the right to recoup any and all such payments or charges by deducting them from any compensation payable to the Commissionee per this Agreement. Any petty cash advances not repaid or correctly accounted for will be deducted from the Fee and/or any other payments due to the Commissionee.

Parties Relationship/Tax/Social Security Contributions:

The relationship between the Commissionee and the Commissioner will be that of independent contractor and nothing in this Agreement shall render the Commissionee an employee, worker, agent, or partner of the Commissioner and the Commissionee shall not, save as expressly provided in this Agreement, hold itself out as such. Accordingly:
(a) the Commissionee shall be solely responsible for all taxes, social security contributions, and other contributions and fringes due in respect of the Commissionee's Services provided hereunder and the Commissionee indemnifies the Commissioner for any sum which the Commissionee is required to pay to a relevant authority by way of income tax or social security contributions and other taxes, contributions, and fringes to the fullest extent permitted by applicable law and which arises as a result of the Commissionee's services provided under this Agreement;
(b) the Commissionee will be fully responsible for and agrees to indemnify the Commissioner against all costs, claims, damages, or expenses incurred by the Commissioner, or for which the Commissioner may become liable, with respect to any liability for any employment-related claim or any claim based on employee or worker status brought by the Commissionee or any third party against the Commissioner in connection with this Agreement (including without limitation any claim relating to holiday pay or in respect of relevant working hours legislation); and
(c) the Commissionee will comply with the legislation in force, in particular with respect to relevant labor law and safety, as well as with the provisions of this Agreement. In no circumstances shall Commissioner be liable for or Commissionee be entitled to any employment benefits, including but not limited to medical insurance, paid leave, end-of-service benefits as a result of this Agreement.

Confidentiality:

If in connection with the Services or the subject matter of this Agreement, the Commissionee at any time receives or has access to at any confidential information (including without limitation concerning the business, affairs, products, plans, designs, business relationships or finances) of the Commissioner or Client or of any of the Commissioner or Client's Group Companies, affiliates or partners (together Confidential Information):
the Commissionee will use such Confidential Information only as necessary to perform the Services;
the Commissionee will keep such Confidential Information secure, using precautions no less rigorous than those taken to preserve its own confidential information;
the Commissionee will not disclose the Confidential Information to any third party except with the prior written approval of the Commissioner (and shall ensure that any such disclosure is subject to obligations of confidentiality and non-use equivalent to those in this Agreement). The Commissionee will be liable for any subsequent disclosure or misuse of the Confidential Information by any such person; and
the Commissionee will return to the Commissioner, and delete from its systems, all Confidential Information on conclusion of the Services or termination of this Agreement (whichever is the later),

and each such obligation shall survive termination of this Agreement however caused. The Commissionee may disclose Confidential Information as required by law, provided that the Commissionee notifies the Commissioner as early as possible prior to any such disclosure in order to enable the Commissioner to take steps to preserve the continued confidence of the Confidential Information.

Warranties:

The Commissionee agrees, undertakes, represents and warrants to the Commissioner that:
the Commissioned Content will be its original work and will not be copied wholly or substantially from any other work or material or any other source;
the Commissionee is the sole legal and beneficial owner of all intellectual property rights in the Commissioned Content and has right to enter into this Agreement and to grant the licences granted herein;
the exploitation by the Commissioner of the rights granted herein will not infringe or violate the rights of any third party;
it has not granted any licenses under the intellectual property rights in the Commissioned Content to any other person;
the Commissioned Content will not contain any content or material which is defamatory, obscene, constitutes a breach of confidence or privacy or is in any other way unlawful;
the Commissionee has or will have obtained all necessary consents and image rights waivers from the subjects of the Commissioned Content (or in the case of minors, their parent or guardian) for the uses of the Commissioned Content licensed under this Agreement;
the Commissioned Content will not in any way rely on, utilise or incorporate any work created by any third party or undertaken at any time by the Commissionee for any third party, except as expressly approved in writing by the Commissioner. The Commissionee will retain copies of transcripts and each of the sources used to create the Commissioned Content; and
where applicable, the Commissionee has secured all third-party permissions and releases necessary to grant the licences granted herein and has made or will make in a timely manner all payments to any such third parties necessary to enable the Commissioner to exercise the rights granted under this Agreement. The Commissionee will provide copies of such releases or such other evidence as the Commissioner may reasonably request.
Commissionee shall not engage any person to serve in any capacity or incur any charge, expense, liability or obligation on behalf of Commissioner or order goods or pledge Commissioner's credit without the prior written consent from Commissioner;
Commissionee shall not (i) accept or pay any consideration (other than consideration paid by Commissioner to Comissionee under this Agreement) or gratuity in exchange for the inclusion of material in the Commissioned Content or (ii) accept, any money, services, goods or other valuable consideration for the inclusion of any plug, reference, product identification or other matter within the Commissioned Content or any element thereof
Comissionee (i) will comply with the  all anti-bribery and/or corruption laws (including, without limitation, the United Kingdom Bribery Act 2010 and the U.S. Foreign Corrupt Practices Act, both as amended from time to time, and any other applicable anti-corruption laws; and (ii) you have not and will not directly or indirectly make any payment(s) or give anything of value to any government employee or official with respect to the Services, or any activity related thereto for the purpose of influencing and decision and/or action of such government employee or official in their official capacity.

Indemnity & Insurance:

The Commissionee shall indemnify and hold the Commissioner harmless from all claims and all direct, indirect or consequential liabilities (including loss of profits, loss of business, depletion of goodwill and similar losses), costs, proceedings, damages and expenses (including legal and other professional fees and expenses) awarded against, or incurred or paid by, the Commissioner as a result of or in connection with any breach by Commissionee of its obligations, representations and/or warranties under this Agreement. The Commissionee shall maintain in force during the period of this Agreement adequate insurance cover with reputable insurers acceptable to Commissioner, including but not limited to health and personal accident insurance in respect of Commissionee, and equipment insurance in respect of any equipment hired to Commissionee for the production of the Commissioned Content.

Termination:

The Commissioner may terminate this Agreement by written notice if:
the Commissionee is deemed unable to perform or commits a breach of its obligations under this Agreement and (if such breach shall be capable of remedy) fails to remedy it within seven (7) days of receipt of notice requiring it to do so;
the Commissionee goes into compulsory or voluntary liquidation, suspends or threatens to suspend its business operations or offering, goes into administration or becomes bankrupt;
the Commissionee is convicted of a criminal offence or engages in or is party to any action or arrangement which may detrimentally affect the reputation of the Commissioner;
the Commissionee is incapacitated (including by reason of illness or accident) or otherwise prevented from providing the Services for a period of more than two weeks;
the Commissioner may terminate at its convenience for any other reason up to three weeks prior to the commencement of Commissionee's engagement (e.g. Shoot date) under this Agreement.

Force Majeure:

In the event that due to circumstances beyond either of the parties' control (including but not limited to war, act of public enemy, terrorism , riot, civil commotion, union strike, labour conditions, fire, casualty, accident, volcanic ash, act of God, epidemic or pandemic (including without limitation COVID-19) judicial order or enactment, act of government, failure of technical facilities, inability to secure necessary location or filming permits, licences or releases, necessary visas or work permits, essential commodities, necessary equipment or personnel or adequate transportation, incapacity or death of key personnel or subjects; withdrawal of funding for the Commissioned Content by the Client; or the Client refusing to approve Commissionee's engagement in respect of the Commissioned Content (each an Event of Force Majeure) the Services for which Commisionee been engaged is prevented, delayed or interrupted Commissionee shall be entitled by written notice to suspend Commissionee's engagement with immediate effect for the period of the interruption and such additional period as Agency may require to resume the production of the Commissioned Content or to terminate Comissionee's engagement with no liability for payment of the Fee.

Miscellaneous:

This Agreement contains the whole agreement between the parties and supersedes any prior written or oral agreement between them in relation to its subject matter, and the parties confirm that they have not entered into this Agreement in reliance on any representations that are not expressly incorporated into this Agreement.
No variation of this Agreement shall be valid unless it is in writing and signed by or on behalf of each of the parties.
No whole or partial waiver of any breach of this Agreement shall be held to be a waiver of any other or any subsequent breach. The whole or partial failure of either party to enforce at any time the provisions of this Agreement shall in no way be construed to be a waiver of such provisions nor in any way affect the validity of this Agreement or any part of it or the right of either party to enforce subsequently each and every provision. No waiver shall be effective unless in writing.
If any provision of this Agreement or any part thereof shall become or be declared illegal invalid or unenforceable for any reason such provision or part shall be severed from this Agreement provided that if any such deletion substantially affects or alters the commercial basis of this Agreement the parties shall negotiate in good faith to amend and modify the provisions and terms of this Agreement as may be necessary or desirable in the circumstances.
This Agreement may be executed in any number of counterparts, each of which, when executed and delivered, shall be an original, and all the counterparts together shall constitute one and the same instrument.
This Agreement and any contractual or non-contractual dispute arising out of or in connection with it shall be governed by and construed in accordance with English law, and the parties irrevocably submit to the exclusive jurisdiction of the English Courts over any claim or matter arising under or in connection with this Agreement, whether contractual or non-contractual.`,
  commission_psc: `GENERAL TERMS

These General Terms together with the Head Terms above constitute an agreement (the "Agreement") under which the Commissionee agrees procure that the Individual provides the Services to the the Commissioner. The parties hereby accept and agree to be bound by the terms set out in this Agreement. Should there be any conflict between the Head Terms and the General Terms, the Head Terms shall prevail.

IT IS AGREED AS FOLLOWS:

The Commissionee shall procure that the Individual creates and supplies the Commissioned Content to the Commissioner (the Services) by the Deadline for Submission, in relation to which, time is of the essence. The Commissionee shall procure that the Individual will perform the Services in a diligent and professional manner, in accordance with applicable law and with the Commissioner's reasonable instructions (including any agreed briefing document). The Commissionee shall ensure that the Individual liaises with, and reports to, the Commissioner as reasonably required so that the Commissioner is appropriately appraised of progress.

The Commissionee and the Individual each irrevocably and unconditionally assign to the Commissioner, with full title guarantee, all rights, title and interest (whether now known or in future created and whether vested or contingent) in and to the Commissioned Content and the entire copyright therein (including all rights in the nature of copyright and all neighbouring rights, including any rental and lending rights and the right to communicate to the public), throughout the world, for the full period of such rights and all renewals, reversions, revivals and extensions, and thereafter (insofar as legally possible) in perpetuity. The Commissionee shall procure, and the Individual hereby gives, an unconditional and irrevocable waiver in favour of the Commissioner of all moral rights in or relating to the Commissioned Content arising under the Copyright, Designs and Patents Act 1988 and, so far as is legally possible, any broadly equivalent rights in any territory of the world.. Should the Commissioner or the Client's usage of the Commissioned Content be limited by the Head Terms of this Agreement, Commissioner agrees that it will not, and it will not authorize the Client to exceed these Usage limitations.

Subject to the Commissioner's prior written approval (not to be unreasonably withheld), the Commissionee and the Individual may use the Commissioned Content for portfolio purposes to promote their catalogue of work in print, digital or online platforms, provided that: (i) no use is made prior to first use by the Commissioner; and (ii) no use implies any relationship with the Commissioner beyond that set out in this Agreement.

Payment Terms:

In consideration of the supply and assignment of the Commissioned Content by the Commissionee, the Commissioner shall pay to the Commissionee the Fee. No expenses or disbursements incurred by the Commissionee shall be payable by the Commissioner unless agreed by the Commissioner in writing in advance. The Commissionee may invoice the Commissioner at any time after delivery of the Commissioned Content to the Commissioner and the Commissioner shall pay each invoice which is properly due within 60 days of the date on which the invoice is received.

Unless otherwise indicated in the Head Terms, the Fee is exclusive of VAT, which, if applicable, the Commissionee shall add to its invoices at the appropriate rate.

The Commissioner shall have the right to deduct and withhold from any payments due to the Commissionee all withholding and/or other taxes, contributions, or other payments required to be deducted, withheld, or paid by the Commissioner per any applicable present or future law or governmental rule or regulation. If the Commissioner does not deduct or withhold such taxes or other payments, the Commissionee shall immediately pay (whether on demand to the Commissioner or to the relevant authority) any and all such taxes, contributions, or other payments, together with all penalties, charges, and interest relating to the foregoing, and the Commissionee indemnifies the Commissioner and shall keep the Commissioner fully and effectually indemnified from and against any liability or expense in connection with such taxes or other payments (save to the extent that such recovery is prohibited by law).

If: (i) the Commissioner makes any payment or incurs any charge at the Commissionee's or Individual's request for the Commissionee's or Individual's account (which the Commissioner is not obliged to do); or (ii) the Commissionee or Individual incur any charges with the Commissioner, causes any damage to the Commissioner's materials, property, or accommodation, or causes the Commissioner to incur or bear any costs in connection with the Commissionee or Individual losing, or failing to return on request, the Commissioner's property or third-party property for which the Commissioner has financial responsibility (e.g., a security pass, vehicle-associated penalties); the Commissioner shall have the right to recoup any and all such payments or charges by deducting them from any compensation payable to the Commissionee per this Agreement. Any petty cash advances not repaid or correctly accounted for will be deducted from the Fee and/or any other payments due to the Commissionee.

Parties Relationship/Tax/Social Security Contributions:

The relationship between the Commissionee and the Commissioner will be that of independent contractor and nothing in this Agreement shall render the Commissionee or Individual an employee, worker, agent, or partner of the Commissioner and neither the Commissionee nor Individual shall, save as expressly provided in this Agreement, hold themselves out as such. Accordingly:
(a) the Commissionee shall be solely responsible for all taxes, social security contributions, and other contributions and fringes due in respect of the Commissionee's and Individual's Services provided hereunder and the Commissionee indemnifies the Commissioner for any sum which the Commissionee is required to pay to a relevant authority by way of income tax or social security contributions and other taxes, contributions, and fringes to the fullest extent permitted by applicable law and which arises as a result of the Commissionee's or Individual's services provided under this Agreement;
(b) the Commissionee will be fully responsible for and agrees to indemnify the Commissioner against all costs, claims, damages, or expenses incurred by the Commissioner, or for which the Commissioner may become liable, with respect to any liability for any employment-related claim or any claim based on employee or worker status brought by the Commissionee, Individual or any third party against the Commissioner in connection with this Agreement (including without limitation any claim relating to holiday pay or in respect of relevant working hours legislation); and
(c) the Commissionee will comply with the legislation in force, in particular with respect to relevant labor law and safety, as well as with the provisions of this Agreement, and shall ensure the Individual's compliance with the same. In no circumstances shall Commissioner be liable for or Commissionee/Individual be entitled to any employment benefits, including but not limited to medical insurance, paid leave, end-of-service benefits as a result of this Agreement.

Confidentiality:

If in connection with the Services or the subject matter of this Agreement, the Commissionee and/or Individual at any time receives or has access to at any confidential information (including without limitation concerning the business, affairs, products, plans, designs, business relationships or finances) of the Commissioner or Client or of any of the Commissioner or Client's Group Companies, affiliates or partners (together Confidential Information):
they shall use such Confidential Information only as necessary to perform the Services;
they shall keep such Confidential Information secure, using precautions no less rigorous than those taken to preserve its own confidential information;
they shall not disclose the Confidential Information to any third party except with the prior written approval of the Commissioner (and shall ensure that any such disclosure is subject to obligations of confidentiality and non-use equivalent to those in this Agreement). The Commissionee will be liable for any subsequent disclosure or misuse of the Confidential Information by any such person; and
they shall will return to the Commissioner, and delete from its systems, all Confidential Information on conclusion of the Services or termination of this Agreement (whichever is the later),

and each such obligation shall survive termination of this Agreement however caused. The Commissionee may disclose Confidential Information as required by law, provided that the Commissionee notifies the Commissioner as early as possible prior to any such disclosure in order to enable the Commissioner to take steps to preserve the continued confidence of the Confidential Information.

Warranties:

The Commissionee agrees, undertakes, represents and warrants, and shall procure that the Individual agrees, undertakes, represents and warrants to the Commissioner that:
the Commissioned Content will be their original work and will not be copied wholly or substantially from any other work or material or any other source;
the Commissionee is the sole legal and beneficial owner of all intellectual property rights in the Commissioned Content and has right to enter into this Agreement and to grant the licences granted herein;
the exploitation by the Commissioner of the rights granted herein will not infringe or violate the rights of any third party;
they have not granted any licenses under the intellectual property rights in the Commissioned Content to any other person;
the Commissioned Content will not contain any content or material which is defamatory, obscene, constitutes a breach of confidence or privacy or is in any other way unlawful;
the Commissionee has or will have obtained all necessary consents and image rights waivers from the subjects of the Commissioned Content (or in the case of minors, their parent or guardian) for the uses of the Commissioned Content licensed under this Agreement;
the Commissioned Content will not in any way rely on, utilise or incorporate any work created by any third party or undertaken at any time by the Commissionee for any third party, except as expressly approved in writing by the Commissioner. The Commissionee will retain copies of transcripts and each of the sources used to create the Commissioned Content; and
where applicable, the Commissionee has secured all third-party permissions and releases necessary to grant the licences granted herein and has made or will make in a timely manner all payments to any such third parties necessary to enable the Commissioner to exercise the rights granted under this Agreement. The Commissionee will provide copies of such releases or such other evidence as the Commissioner may reasonably request.
Commissionee nor Individual shall engage any person to serve in any capacity or incur any charge, expense, liability or obligation on behalf of Commissioner or order goods or pledge Commissioner's credit without the prior written consent from Commissioner;
Commissionee nor Individual shall (i) accept or pay any consideration (other than consideration paid by Commissioner to Commissionee under this Agreement) or gratuity in exchange for the inclusion of material in the Commissioned Content or (ii) accept, any money, services, goods or other valuable consideration for the inclusion of any plug, reference, product identification or other matter within the Commissioned Content or any element thereof
Commissionee and Individual (i) will comply with the  all anti-bribery and/or corruption laws (including, without limitation, the United Kingdom Bribery Act 2010 and the U.S. Foreign Corrupt Practices Act, both as amended from time to time, and any other applicable anti-corruption laws; and (ii) will not directly or indirectly make any payment(s) or give anything of value to any government employee or official with respect to the Services, or any activity related thereto for the purpose of influencing and decision and/or action of such government employee or official in their official capacity.

Indemnity & Insurance:

The Commissionee and the Individual shall jointly and severally indemnify and hold the Commissioner harmless from and against all claims and all direct, indirect or consequential liabilities (including loss of profits, loss of business, depletion of goodwill and similar losses), costs, proceedings, damages and expenses (including legal and other professional fees and expenses) arising out of or in connection with any breach by the Commissionee or the Individual of their obligations, representations and/or warranties under this Agreement. The Commissionee shall maintain in force during the period of this Agreement adequate insurance cover with reputable insurers acceptable to Commissioner, including but not limited to health and personal accident insurance in respect of Individual, and equipment insurance in respect of any equipment hired to Commissionee for the production of the Commissioned Content.

Termination:

The Commissioner may terminate this Agreement by written notice if:
the Commissionee or Individual is deemed unable to perform or commits a breach of its obligations under this Agreement and (if such breach shall be capable of remedy) fails to remedy it within seven (7) days of receipt of notice requiring it to do so;
the Commissionee goes into compulsory or voluntary liquidation, suspends or threatens to suspend its business operations or offering, goes into administration or becomes bankrupt;
the Commissionee or Individual is convicted of a criminal offence or engages in or is party to any action or arrangement which may detrimentally affect the reputation of the Commissioner;
the Commissionee or Individual is incapacitated (including by reason of illness or accident) or otherwise prevented from providing the Services for a period of more than two weeks;
the Commissioner may terminate at its convenience for any other reason up to three weeks prior to the commencement of Commissionee's engagement (e.g. Shoot date) under this Agreement.

Force Majeure:

In the event that due to circumstances beyond either of the parties' control (including but not limited to war, act of public enemy, terrorism , riot, civil commotion, union strike, labour conditions, fire, casualty, accident, volcanic ash, act of God, epidemic or pandemic (including without limitation COVID-19) judicial order or enactment, act of government, failure of technical facilities, inability to secure necessary location or filming permits, licences or releases, necessary visas or work permits, essential commodities, necessary equipment or personnel or adequate transportation, incapacity or death of key personnel or subjects; withdrawal of funding for the Commissioned Content by the Client; or the Client refusing to approve Commissionee's engagement in respect of the Commissioned Content (each an Event of Force Majeure) the Services for which Commisionee been engaged is prevented, delayed or interrupted Commissioner shall be entitled by written notice to suspend Talent's engagement with immediate effect for the period of the interruption and such additional period as Agency may require to resume the production of the Campaign or to terminate Talent's engagement with no liability for payment of the Fee.

Miscellaneous:

This Agreement contains the whole agreement between the parties and supersedes any prior written or oral agreement between them in relation to its subject matter, and the parties confirm that they have not entered into this Agreement in reliance on any representations that are not expressly incorporated into this Agreement.
No variation of this Agreement shall be valid unless it is in writing and signed by or on behalf of each of the parties.
No whole or partial waiver of any breach of this Agreement shall be held to be a waiver of any other or any subsequent breach. The whole or partial failure of either party to enforce at any time the provisions of this Agreement shall in no way be construed to be a waiver of such provisions nor in any way affect the validity of this Agreement or any part of it or the right of either party to enforce subsequently each and every provision. No waiver shall be effective unless in writing.
If any provision of this Agreement or any part thereof shall become or be declared illegal invalid or unenforceable for any reason such provision or part shall be severed from this Agreement provided that if any such deletion substantially affects or alters the commercial basis of this Agreement the parties shall negotiate in good faith to amend and modify the provisions and terms of this Agreement as may be necessary or desirable in the circumstances.
This Agreement may be executed in any number of counterparts, each of which, when executed and delivered, shall be an original, and all the counterparts together shall constitute one and the same instrument.
This Agreement and any contractual or non-contractual dispute arising out of or in connection with it shall be governed by and construed in accordance with English law, and the parties irrevocably submit to the exclusive jurisdiction of the English Courts over any claim or matter arising under or in connection with this Agreement, whether contractual or non-contractual.`,
  talent: `GENERAL TERMS

These Commercial Terms and General Terms together constitute an agreement (the "Agreement") under which the Talent agrees to provide the Services to the Client & the Agency. The parties hereby accept and agree to be bound by the terms set out in this Agreement. Should there be any conflict between the Commercial Terms and the General Terms, the Commercial Terms shall prevail.

IT IS AGREED AS FOLLOWS:

Definitions:

"Business Day" means a day other than a Saturday, Sunday or public holiday in England or UAE, as relevant.

"Fee" means the charges payable by the Brand via the Agent for the supply of the Services by the Talent, as set out in the Commercial Terms.

"Group" in relation to a company, that company, any subsidiary or holding company from time to time of that company, and any subsidiary from time to time of a holding company of that company. "Intellectual Property Rights" means patents, rights to inventions, copyright and related rights, moral rights, trade marks and service marks, business names and domain names, rights in get-up, goodwill and the right to sue for passing off or unfair competition, rights in designs, database rights, rights to use, and protect the confidentiality of, confidential information (including know-how and trade secrets) and all other intellectual property rights, in each case whether registered or unregistered and including all applications and rights to apply for and be granted, renewals or extensions of, and rights to claim priority from, such rights and all similar or equivalent rights or forms of protection which subsist or will subsist now or in the future in any part of the world.

"Services" the services to be provided by the Talent pursuant to the Agreement, as described in the Commercial Terms. "Term" has the meaning set out in clause 2 of the General Conditions.

Interpretation:

A reference to a statute or statutory provision is a reference to it as amended, extended or re-enacted from time to time. A reference to a statute or statutory provision includes any subordinate legislation made from time to time under that statute or statutory provision.
Any words following the terms including, include, in particular, for example or any similar expression shall be construed as illustrative and shall not limit the sense of the words, description, definition, phrase or term preceding those terms.
A reference to writing or written includes email.

COMMENCEMENT AND TERM

The Agreement shall commence on the Commencement Date and shall continue, unless terminated earlier in accordance with its terms, as set out in the Commercial Terms (the "Term").

SUPPLY OF SERVICES

The Talent shall supply the Services to the Agency & Brand in accordance with the Agreement.

In performing the Services, Talent shall meet any performance dates and times specified in the Commercial Terms, and time shall be of the essence as to the same.

In supplying the Services, the Talent shall:
perform the Services with the highest level of care, skill and diligence in accordance with best practice in the Talent's industry, profession or trade;
co-operate with the Agency & Brand in all matters relating to the Services, and comply with the Agency & Brand's instructions;
ensure that he/she obtains, and maintains all consents, licences and permissions (statutory, regulatory, contractual or otherwise) he/she may require and which are necessary to enable him/ her to comply with his/her obligations in the Agreement;
ensure that the Services conform in all respects with the description set out in the Commercial Terms;
ensure that any statements made as part of the campaign are honest and, to the best of Talent's knowledge and belief, true and will not infringe the copyright or any other right of any person, breach any contract or duty of confidence, constitute a contempt of court or be defamatory.
comply with all applicable laws, statutes, regulations and codes from time to time in force;
observe all health and safety rules and regulations and any other reasonable security requirements that apply at the Venue and/or for the Shoot from time to time as are communicated to the Talent;
not do or omit to do anything which may cause the Agency, Brand or the Venue to lose any licence, authority, consent or permission on which it relies for the purposes of conducting its business;
not do anything or make any statement or otherwise conduct himself/herself in a manner which (in the Agency & Brand's reasonable opinion) may adversely affect the reputation of the Agency & Brand, the Campaign or any of the Agency & Brand's affiliates (or any brands, products or services owned by or associated with the Agency & Brand) or which would or may bring the Agency & Brand, its Group, its affiliates, brands owned or associated with the Agency & Brand, the Agent or the Talent into disrepute.

WARRANTIES & INDEMNITY

The Talent warrants, represents and undertakes that:
they have the right to enter into, and grant the rights under this Agreement and the Talent is not subject to any prior or existing contractual or other obligation that prevents, restricts, limits or in any way affects his/her capacity to enter into this Agreement or their ability to perform any obligations under this Agreement;
the Talent is, to the best of their knowledge and belief, in such a state of health that they will be able to fulfil all obligations under this Agreement;
the Talent has not, prior to the date of the execution of this Agreement, made any statement or done anything which would or may adversely affect the reputation or perception of the Talent, the Agency & Brand, the Agency & Brand's affiliates, or any Agency & Brands, products or services owned by or associated with the Agency & Brand; and
the Talent does not have a criminal record of any kind, is not subject to any outstanding criminal investigation and has never received or been recommended treatment for addiction to drugs, alcohol or gambling.

Talent indemnifies Agency and shall keep Agency fully indemnified against any and all claims, costs, expenses and/or damages incurred by Agency, or for which Agency may become liable, as a result of any breach of Talent of its obligations, representations and/or warranties under this Agreement.

Where an Agent executes this Agreement on behalf of Talent, they warrant, represent and undertake that they have the right to enter into this Agreement on behalf of Talent and agree that they shall be jointly and severally liable for the Talent's failure to comply with the terms of this Agreement.

AGENCY'S OBLIGATIONS

In consideration of the Talent providing the Services in accordance with the Commercial Terms, the Agency shall:
fulfil the Agency obligations as set out in the Commercial Terms; and
provide such necessary information for the provision of the Services as the Talent may reasonably request; and
comply with all applicable laws, statutes, regulations and codes from time to time in force (including but not limited to applicable data protection laws, under which all personal information acquired as part of the Campaign will be used exclusively for the Specified Purpose and shall be stored strictly in accordance with such applicable data protection laws).

IMAGE WAIVER

In consideration of the Agency fulfilling its obligations under the Agreement, the Talent warrants, confirms and agrees that:
The Agency & Brand and its relevant third parties may use any and all Content taken at or created as a result of the Shoot which may or may not include the Talent, along with any other talent selected by The Agency & Brand;
the Content will be captured by the Agency & Brand and/or a third party hired by the Agency & Brand at its discretion and may be used, along with any additional content created by the Agency & Brand, for the purpose of promoting the Campaign as set out in the "Usage" section of the Commercial Terms. All uses (including the Usage) as described in the Commercial Terms shall be collectively referred to as the "Specified Purpose";
the Talent irrevocably and unconditionally grants to the Agency & Brand (and its successors, assignees, licensees, and affiliates, as appropriate) all consents required pursuant to the Copyright, Designs and Patents Act 1988, Part II or otherwise under the laws in force in any part of the world to exploit the Content for the Specified Purpose; and
the Talent irrevocably and unconditionally waives in favour of the Brand:
all rights which he/she may have in respect of the Content pursuant to the Copyright, Designs and Patents Act 1988, sections 77, 80, 84, 85, 205C and 205F (or otherwise under the laws in force in any part of the world) and that he/she has consented to the exclusive use by the Brand and its successors, assignees, licensees, affiliates and subcontractors of his/her name, likeness, voice and biography (as applicable) in connection with the Specified Purpose; and
any moral rights he/she may have in any Content including (but without limitation) the right to be identified, the right of integrity and the right against false attribution, and agrees not to institute, support, maintain or permit any action or claim to the effect that any treatment, exploitation or use of the Content infringes his/her moral rights.

Notwithstanding clause 6.1, it is acknowledged that the Content in whatever form shall and all copies of the same shall be the sole property of the Agency & Brand (or its successors, assignees, or affiliates).

INTELLECTUAL PROPERTY

Talent irrevocably and unconditionally assign to Agency free of all third party rights, claims and encumbrances and, without prejudice to the foregoing, with full title guarantee and where the assignment is of copyright by way of assignment of present and future copyright, all of Talent's rights, title and interests of whatsoever nature (whether now or hereafter known or created and whether vested or contingent) in and to the entire copyright in the Content and Campaign (including all rights in the nature of copyright and all neighbouring rights relating to the Content including without limitation any rental and lending rights and the right to communicate to the public for Agency to hold the same absolutely, throughout the world, for the full period of such rights wherever subsisting or acquired and all renewals, reversions, revivals and extensions of such rights and thereafter (insofar as is or may become possible) in perpetuity.

CHARGES AND PAYMENT

In consideration for the provision of the Services, the Agency shall pay the Talent the Fee in accordance with the Commercial Terms and this clause 8.

The Talent shall submit its invoice(s) for the Fee after the Shoot, and such invoice shall be addressed to the Agency as set out in the Commercial Terms.

The Agency shall pay the Talent's invoice(s) which are properly due and submitted, within sixty (60) days from the date the invoice is received, to a bank account nominated in writing by the Talent.

The Agency shall have the right to deduct and withhold from any payments due to the Talent all withholding and/or other taxes, contributions, or other payments required to be deducted, withheld, or paid by the Agency per any applicable present or future law or governmental rule or regulation. If the Agency does not deduct or withhold such taxes or other payments, the Talent shall immediately pay (whether on demand to the Agency or to the relevant authority) any and all such taxes, contributions, or other payments, together with all penalties, charges, and interest relating to the foregoing, and the Talent indemnifies the Agency and shall keep the Agency fully and effectually indemnified from and against any liability or expense in connection with such taxes or other payments (save to the extent that such recovery is prohibited by law).If: (i) the Agency makes any payment or incurs any charge at the Talent's request for the Talent's account (which the Agency is not obliged to do); or (ii) the Talent incurs any charges with the Agency, causes any damage to the Agency, Brand or Venue's materials, property, or accommodation, or causes the Agency to incur or bear any costs in connection with the Talent losing, or failing to return on request, the Agency's property or third-party property for which the Agency has financial responsibility (e.g., a security pass, vehicle-associated penalties); the Agency shall have the right to recoup any and all such payments or charges by deducting them from any compensation payable to the Talent per this Agreement. Any petty cash advances not repaid or correctly accounted for will be deducted from the Fee and/or any other payments due to the Talent.

Where notified to Talent by Agency, in some engagements the Brand will pay the Talent directly. In such circumstances, reference to Agency in this Clause 8 will be deemed to read Brand.

Where Talent has an Agent as per the Head Terms of this Agreement, any payments and written notices under this Agreement may be submitted to the Agent (and receipt by the Agent of payments into the Agent's bank account shall fully discharge Agency's obligation to make such payments to Talent).  Talent warrants, represents and undertakes to Agency that Agent is irrevocably authorised and empowered by Talent to act and negotiate on Talent's behalf in all matters arising from and pertaining to this Agreement.

LIMITATION OF LIABILITY

Nothing in this Agreement limits any liability which cannot legally be limited, including liability for:
death or personal injury caused by negligence; and
fraud or fraudulent misrepresentation.

Subject to clause 9.1, the Agency & Brand's total cumulative liability to the Talent (and Agent, if applicable) shall not exceed the Fee. Neither party shall have any liability to the other (including liability in tort) under or in connect with this Agreement for any indirect or consequential loss or damange.

The rights of the parties under the Agreement are in addition to, and not exclusive of, any rights or remedies provided by common law.

INSURANCE

The Talent shall maintain in force during the period of this Agreement adequate insurance cover with reputable insurers acceptable to Agency, including but not limited to health and personal accident insurance in respect of Talent and insurance in respect of any equipment provided for the shoot by Talent.

TERMINATION

Without affecting any other right or remedy available to it, either party may terminate the Agreement with immediate effect by giving written notice to the other party if:
the other party commits a material breach of any term of the Agreement which breach is irremediable or (if such breach is remediable) fails to remedy that breach within a period of seven (7) days after being notified to do so;
the other party takes any step or action in connection with its entering administration, provisional liquidation or any composition or arrangement with its creditors (other than in relation to a solvent restructuring), being wound up (whether voluntarily or by order of the court, unless for the purpose of a solvent restructuring), having a receiver appointed to any of its assets or ceasing to carry on business or, if the step or action is taken in another jurisdiction, in connection with any analogous procedure in the relevant jurisdiction; or
the other party suspends, or threatens to suspend, or ceases or threatens to cease to carry on all or a substantial part of its business.

In the event that due to circumstances beyond either of the parties' control (including but not limited to war, act of public enemy, terrorism , riot, civil commotion, union strike, labour conditions, fire, casualty, accident, volcanic ash, act of God, epidemic or pandemic (including without limitation COVID-19) judicial order or enactment, act of government, failure of technical facilities, inability to secure necessary location or filming permits, licences or releases, necessary visas or work permits, essential commodities, necessary equipment or personnel or adequate transportation, incapacity or death of key personnel or subjects, withdrawal of funding for the Campaign by the Brand (each an Event of Force Majeure) the Campaign or any shoot for the Campaign for which Talent have been engaged is prevented, delayed or interrupted Agency shall be entitled by written notice to suspend Talent's engagement with immediate effect for the period of the interruption and such additional period as Agency may require to resume the production of the Campaign or to terminate Talent's engagement

Any provision of the Agreement that expressly or by implication is intended to come into or continue in force on or after termination or expiry of the Agreement shall remain in full force and effect.

Termination or expiry of the Agreement shall not affect any of the rights, remedies, obligations or liabilities of the parties that have accrued up to the date of termination or expiry, including the right to claim damages in respect of any breach of the Agreement which existed at or before the date of termination or expiry.

GENERAL

Subcontracting. The Talent may not subcontract any or all of its rights or obligations under the Agreement without the prior written consent of the Agency, and the Services shall not be fulfilled unless performed by the Talent personally. If the Agency consents to any subcontracting by the Agent, the Agent shall remain responsible for all acts and omissions of its subcontractors as if they were its own.

Parties Relationship:

The relationship between Talent and Agency will be that of independent contractor and nothing in this Agreement shall render Talent an employee, worker, agent or partner of Agency and Talent shall not, save as expressly provided in this Agreement, hold themselves out as such. Accordingly:
(a) Talent shall be solely responsible for all taxes, social security contributions and other contributions and fringes due in respect of the services provided hereunder and shall indemnify Agency for any sum which Agency is required to pay to a relevant authority by way of income tax or social security contributions and other taxes, contributions and fringes to the fullest extent permitted by Applicable Law and which arises as a result of the services provided under this Agreement;
(b) Talent will be fully responsible for and agrees to indemnify Agency against all costs, claims, damages or expenses incurred by Agency, or for which Agency may become liable, with respect to any liability for any employment-related claim or any claim based on employee or worker status brought by Talent or any third party against Agency in connection with this Agreement (including without limitation any claim relating to holiday pay or in respect of applicable working hours legislation). All sums payable to Talent under this Agreement are fully inclusive of any applicable Value Added Tax, sales tax or similar tax; and
(c) Talent shall ensure and guarantee compliance with the legislation in force, in particular with respect to applicable labor law and safety, as well as with the provisions of this Agreement. In no circumstances shall Agency be liable for or Talent be entitled to any employment benefits, including but not limited to medical insurance, paid leave, end-of-service benefits as a result of this Agreement.

Confidentiality

Talent undertakes that it shall not disclose to any person the existence of this Agreement and details of its terms, or any confidential information concerning the business, affairs, customers, clients or suppliers of Agency or Brand or of any member of the group to which Agency or Brand belongs, including but not limited to, except as permitted by clause 11.3(b).
Each party may disclose the other party's confidential information and/or the existence and terms of this Agreement:
to its employees, officers, representatives, subcontractors or advisers who need to know such information for the purposes of carrying out the party's obligations under the Agreement. Each party shall ensure that its employees, officers, representatives, subcontractors or advisers to whom it discloses the other party's confidential information comply with this clause 11.2; and
as may be required by law, a court of competent jurisdiction or any governmental or regulatory authority.
Talent shall not use Agency or Brand's confidential information for any purpose other than to perform its obligations under the Agreement.

Data Protection: Agency shall process Talent's personal data in accordance with Agency's Privacy Notice as can be found on Agency's website. Talent agrees to only use and process personal data accrued by Talent and/or provided to Talent by Agency during the course of the engagement under this Agreement in accordance Agency's instructions. Whenever Talent is requested to do so by Agency and in any event at the end of the Terrm or on earlier termination of this Agreement, Talent agree to promptly destroy all personal data accrued by or provided to Talent during the course of the engagement under this Agreement. For the purposes of this clause, personal data means any information relating to an identified or identifiable natural person.

Remedies: If the Agency breaches its obligations under this Agreement, the Talent's rights and remedies shall be limited to the right, if any, to seek to obtain damages at law, and the Talent shall not have any right in such event to terminate or rescind this Agreement or any of the rights granted to the Agency or Brand pursuant to this Agreement or to enjoin or restrain the development, production, promotion, or exploitation of the Campaign and/or any subsidiary or ancillary rights relating to the Campaign or to any other equitable relief. The Talent accepts that a breach by the Talent of any of the material provisions of this Agreement will or may cause the Agency and/or the Brand irreparable damage, and the Talent agrees that the Agency and Brand shall be entitled to injunctive or other equitable relief to prevent a breach of this Agreement.

Entire Agreement. The Agreement constitutes the entire agreement between the parties and supersedes and extinguishes all previous agreements, promises, assurances, warranties, representations and understandings between them, whether written or oral, relating to its subject matter.

Variation. No variation of the Agreement shall be effective unless it is in writing and signed by the parties (or their authorised representatives).

Waiver

A waiver of any right or remedy under the Agreement or by law is only effective if given in writing and shall not be deemed a waiver of any subsequent right or remedy.
A failure or delay by a party to exercise any right or remedy provided under the Agreement or by law shall not constitute a waiver of that or any other right or remedy, nor shall it prevent or restrict any further exercise of that or any other right or remedy. No single or partial exercise of any right or remedy provided under the Agreement or by law shall prevent or restrict the further exercise of that or any other right or remedy.

Severance. If any provision or part-provision of the Agreement is or becomes invalid, illegal or unenforceable, it shall be deemed modified to the minimum extent necessary to make it valid, legal and enforceable. If such modification is not possible, the relevant provision or part-provision shall be deemed deleted. Any modification to or deletion of a provision or part-provision under this clause shall not affect the validity and enforceability of the rest of the Agreement.

Notices: Any notice given to a party under or in connection with the Agreement shall be in writing and shall be sent email to the address specified in the Commercial Terms. Any notice shall be deemed to have been received at the time of transmission, or, if this time falls outside business hours in the place of receipt, when business hours resume. In this clause business hours means 9.00am to 6.00pm Monday to Friday on a day that is not a public holiday in the place of receipt. This clause does not apply to the service of any proceedings or other documents in any legal action.

Third Party Rights: Unless it expressly states otherwise, the Agreement does not give rise to any rights under the Contracts (Rights of Third Parties) Act 1999 to enforce any term of the Contract.

Governing Law and Jurisdiction. The Agreement, and any dispute or claim (including non-contractual disputes or claims) arising out of or in connection with it or its subject matter or formation, shall be governed by, and construed in accordance with, the law of England and Wales.. Each party irrevocably agrees that the courts of England and Wales or UAE (at Agency's sole discretion) shall have exclusive jurisdiction to settle any dispute or claim (including non-contractual disputes or claims) arising out of or in connection with the Agreement or its subject matter or formation`,
  talent_psc: `GENERAL TERMS

These Commercial Terms and General Terms together constitute an agreement (the "Agreement") under which the PSC agrees to provide the Services of the Talent to the Client & the Agency. The parties hereby acceptand agree to be bound by the terms set out in this Agreement. Should there be any conflict between the Commercial Terms and the General Terms, the Commercial Terms shall prevail.

IT IS AGREED AS FOLLOWS:

Definitions:

"Business Day" means a day other than a Saturday, Sunday or public holiday in England or UAE, as relevant.

"Fee" means the charges payable by the Brand via the Agent for the supply of the Services by the Talent, as set out in the Commercial Terms.

"Group" in relation to a company, that company, any subsidiary or holding company from time to time of that company, and any subsidiary from time to time of a holding company of that company. "Intellectual Property Rights" means patents, rights to inventions, copyright and related rights, moral rights, trade marks and service marks, business names and domain names, rights in get-up, goodwill and the right to sue for passing off or unfair competition, rights in designs, database rights, rights to use, and protect the confidentiality of, confidential information (including know-how and trade secrets) and all other intellectual property rights, in each case whether registered or unregistered and including all applications and rights to apply for and be granted, renewals or extensions of, and rights to claim priority from, such rights and all similar or equivalent rights or forms of protection which subsist or will subsist now or in the future in any part of the world.

"Services" the services to be provided by the Talent pursuant to the Agreement, as described in the Commercial Terms.

"Term" has the meaning set out in clause 2 of the General Conditions.

Interpretation:

A reference to a statute or statutory provision is a reference to it as amended, extended or re-enacted from time to time. A reference to a statute or statutory provision includes any subordinate legislation made from time to time under that statute or statutory provision.
Any words following the terms including, include, in particular, for example or any similar expression shall be construed as illustrative and shall not limit the sense of the words, description, definition, phrase or term preceding those terms.
A reference to writing or written includes email.

COMMENCEMENT AND TERM

The Agreement shall commence on the Commencement Date and shall continue, unless terminated earlier in accordance with its terms, as set out in the Commercial Terms (the "Term").

SUPPLY OF SERVICES

The PSC shall procure that the Talent shall supply the Services to the Agency & Brand in accordance with the Agreement..

In performing the Services, the PSC shall procure that the Talent shall meet any performance dates and times specified in the Commercial Terms, and time shall be of the essence as to the same.

In supplying the Services, the PSC shall procure that the Talent shall:
perform the Services with the highest level of care, skill and diligence in accordance with best practice in the Talent's industry, profession or trade;
co-operate with the Agency & Brand in all matters relating to the Services, and comply with the Agency & Brand's instructions;
ensure that he/she obtains, and maintains all consents, licences and permissions (statutory, regulatory, contractual or otherwise) he/she may require and which are necessary to enable him/ her to comply with his/her obligations in the Agreement;
ensure that the Services conform in all respects with the description set out in the Commercial Terms;
ensure that any statements made as part of the campaign are honest and, to the best of Talent's knowledge and belief, true and will not infringe the copyright or any other right of any person, breach any contract or duty of confidence, constitute a contempt of court or be defamatory.
comply with all applicable laws, statutes, regulations and codes from time to time in force;
observe all health and safety rules and regulations and any other reasonable security requirements that apply at the Venue and/or for the Shoot from time to time as are communicated to the Talent;
not do or omit to do anything which may cause the Agency, Brand or the Venue to lose any licence, authority, consent or permission on which it relies for the purposes of conducting its business;
not do anything or make any statement or otherwise conduct himself/herself in a manner which (in the Agency & Brand's reasonable opinion) may adversely affect the reputation of the Agency & Brand, the Campaign or any of the Agency & Brand's affiliates (or any brands, products or services owned by or associated with the Agency & Brand) or which would or may bring the Agency & Brand, its Group, its affiliates, brands owned or associated with the Agency & Brand, the Agent or the Talent into disrepute.

WARRANTIES & INDEMNITY

The PSC warrants, represents and undertakes and shall procure that the Talent warrants, represents and undertakes that:
they have the right to enter into, and grant the rights under this Agreement and the Talent is not subject to any prior or existing contractual or other obligation that prevents, restricts, limits or in any way affects his/her capacity to enter into this Agreement or their ability to perform any obligations under this Agreement;
the Talent is, to the best of their knowledge and belief, in such a state of health that they will be able to fulfil all obligations under this Agreement;
the Talent has not, prior to the date of the execution of this Agreement, made any statement or done anything which would or may adversely affect the reputation or perception of the Talent, the Agency & Brand, the Agency & Brand's affiliates, or any Agency & Brands, products or services owned by or associated with the Agency & Brand; and
the Talent does not have a criminal record of any kind, is not subject to any outstanding criminal investigation and has never received or been recommended treatment for addiction to drugs, alcohol or gambling.

The PSC indemnifies and shall procure that the Talent indemnifies Agency and shall keep Agency fully indemnified against any and all claims, costs, expenses and/or damages incurred by Agency, or for which Agency may become liable, as a result of any breach of PSC or Talent of its obligations, representations and/or warranties under this Agreement.

Where an Agent executes this Agreement on behalf of PSC and Talent, they warrant, represent and undertake that they have the right to enter into this Agreement on behalf of PSC and Talent and agree that they shall be jointly and severally liable for the PSC or Talent's failure to comply with the terms of this Agreement.

AGENCY'S OBLIGATIONS

In consideration of the Talent providing the Services in accordance with the Commercial Terms, the Agency shall:
fulfil the Agency obligations as set out in the Commercial Terms; and
provide such necessary information for the provision of the Services as the Talent may reasonably request; and
comply with all applicable laws, statutes, regulations and codes from time to time in force (including but not limited to applicable data protection laws, under which all personal information acquired as part of the Campaign will be used exclusively for the Specified Purpose and shall be stored strictly in accordance with such applicable data protection laws).

IMAGE WAIVER

In consideration of the Agency fulfilling its obligations under the Agreement, the PSC Talent warrants, confirms and agrees and shall procure that the Talent warrants, confirms and agrees that:
The Agency & Brand and its relevant third parties may use any and all Content taken at or created as a result of the Shoot which may or may not include the Talent, along with any other talent selected by The Agency & Brand;
the Content will be captured by the Agency & Brand and/or a third party hired by the Agency & Brand at its discretion and may be used, along with any additional content created by the Agency & Brand, for the purpose of promoting the Campaign as set out in the "Usage" section of the Commercial Terms. All uses (including the Usage) as described in the Commercial Terms shall be collectively referred to as the "Specified Purpose";
the PSC shall procure that Talent irrevocably and unconditionally grants to the Agency & Brand (and its successors, assignees, licensees, and affiliates, as appropriate) all consents required pursuant to the Copyright, Designs and Patents Act 1988, Part II or otherwise under the laws in force in any part of the world to exploit the Content for the Specified Purpose; and
the PSC shall procure that the Talent irrevocably and unconditionally waives in favour of the Brand:
all rights which he/she may have in respect of the Content pursuant to the Copyright, Designs and Patents Act 1988, sections 77, 80, 84, 85, 205C and 205F (or otherwise under the laws in force in any part of the world) and that he/she has consented to the exclusive use by the Brand and its successors, assignees, licensees, affiliates and subcontractors of his/her name, likeness, voice and biography (as applicable) in connection with the Specified Purpose; and
any moral rights he/she may have in any Content including (but without limitation) the right to be identified, the right of integrity and the right against false attribution, and agrees not to institute, support, maintain or permit any action or claim to the effect that any treatment, exploitation or use of the Content infringes his/her moral rights.

Notwithstanding clause 6.1, it is acknowledged that the Content in whatever form shall and all copies of the same shall be the sole property of the Agency & Brand (or its successors, assignees, or affiliates).

INTELLECTUAL PROPERTY

PSC irrevocably and unconditionally assigns, and shall procure that Talent irrevocably and unconditionally assign to Agency free of all third party rights, claims and encumbrances and, without prejudice to the foregoing, with full title guarantee and where the assignment is of copyright by way of assignment of present and future copyright, all of PSC's and Talent's rights, title and interests of whatsoever nature (whether now or hereafter known or created and whether vested or contingent) in and to the entire copyright in the Content and Campaign (including all rights in the nature of copyright and all neighbouring rights relating to the Content including without limitation any rental and lending rights and the right to communicate to the public for Agency to hold the same absolutely, throughout the world, for the full period of such rights wherever subsisting or acquired and all renewals, reversions, revivals and extensions of such rights and thereafter (insofar as is or may become possible) in perpetuity.

CHARGES AND PAYMENT

In consideration for the provision of Talent's Services, the Agency shall pay the PSC the Fee in accordance with the Commercial Terms and this clause 8.

The PSC shall submit its invoice(s) for the Fee after the Shoot, and such invoice shall be addressed to the Agency as set out in the Commercial Terms.

The Agency shall pay the PSC's invoice(s) which are properly due and submitted, within sixty (60) days from the date the invoice is received, to a bank account nominated in writing by the PSC.

The Agency shall have the right to deduct and withhold from any payments due to the PSC all withholding and/or other taxes, contributions, or other payments required to be deducted, withheld, or paid by the Agency per any applicable present or future law or governmental rule or regulation. If the Agency does not deduct or withhold such taxes or other payments, the PSC shall immediately pay (whether on demand to the Agency or to the relevant authority) any and all such taxes, contributions, or other payments, together with all penalties, charges, and interest relating to the foregoing, and the PSC indemnifies and shall procure that Talent indemnifies the Agency and shall keep the Agency fully and effectually indemnified from and against any liability or expense in connection with such taxes or other payments (save to the extent that such recovery is prohibited by law).If: (i) the Agency makes any payment or incurs any charge at the  PSC's or Talent's request for the PSC or Talent's account (which the Agency is not obliged to do); or (ii) the PSC or Talent incurs any charges with the Agency, causes any damage to the Agency, Brand or Venue's materials, property, or accommodation, or causes the Agency to incur or bear any costs in connection with the Talent losing, or failing to return on request, the Agency's property or third-party property for which the Agency has financial responsibility (e.g., a security pass, vehicle-associated penalties); the Agency shall have the right to recoup any and all such payments or charges by deducting them from any compensation payable to the PSC per this Agreement. Any petty cash advances not repaid or correctly accounted for will be deducted from the Fee and/or any other payments due to the PSC.

Where notified to PSC by Agency, in some engagements the Brand will pay the PSC directly. In such circumstances, reference to Agency in this Clause 8 will be deemed to read Brand.

Where Talent has an Agent as per the Head Terms of this Agreement, any payments and written notices under this Agreement may be submitted to the Agent (and receipt by the Agent of payments into the Agent's bank account shall fully discharge Agency's obligation to make such payments to PSC). PSC warrants, represents and undertakes to Agency that Agent is irrevocably authorised and empowered by Talent to act and negotiate on PSC and Talent's behalf in all matters arising from and pertaining to this Agreement.

LIMITATION OF LIABILITY

Nothing in this Agreement limits any liability which cannot legally be limited, including liability for:
death or personal injury caused by negligence; and
fraud or fraudulent misrepresentation.

Subject to clause 9.1, the Agency & Brand's total cumulative liability to the PSC and Talent shall not exceed the Fee. Neither party shall have any liability to the other (including liability in tort) under or in connect with thisAgreement for any indirect or consequential loss or damange.

The rights of the parties under the Agreement are in addition to, and not exclusive of, any rights or remedies provided by common law.

INSURANCE:

The PSC/Talent shall maintain in force during the period of this Agreement adequate insurance cover with reputable insurers acceptable to Agency, including but not limited to health and personal accident insurance in respect of Talent and insurance in respect of any equipment provided for the shoot by PSC/Talent.

TERMINATION

Without affecting any other right or remedy available to it, either party may terminate the Agreement with immediate effect by giving written notice to the other party if:
the other party commits a material breach of any term of the Agreement which breach is irremediable or (if such breach is remediable) fails to remedy that breach within a period of seven (7) days after being notified to do so;
the other party takes any step or action in connection with its entering administration, provisional liquidation or any composition or arrangement with its creditors (other than in relation to a solvent restructuring), being wound up (whether voluntarily or by order of the court, unless for the purpose of a solvent restructuring), having a receiver appointed to any of its assets or ceasing to carry on business or, if the step or action is taken in another jurisdiction, in connection with any analogous procedure in the relevant jurisdiction; or
the other party suspends, or threatens to suspend, or ceases or threatens to cease to carry on all or a substantial part of its business.

In the event that due to circumstances beyond either of the parties' control (including but not limited to war, act of public enemy, terrorism , riot, civil commotion, union strike, labour conditions, fire, casualty, accident, volcanic ash, act of God, epidemic or pandemic (including without limitation COVID-19) judicial order or enactment, act of government, failure of technical facilities, inability to secure necessary location or filming permits, licences or releases, necessary visas or work permits, essential commodities, necessary equipment or personnel or adequate transportation, incapacity or death of key personnel or subjects, withdrawal of funding for the Campaign by the Brand (each an Event of Force Majeure) the Campaign or any shoot for the Campaign for which Talent have been engaged is prevented, delayed or interrupted Agency shall be entitled by written notice to suspend Talent's engagement with immediate effect for the period of the interruption and such additional period as Agency may require to resume the production of the Campaign or to terminate PSC/Talent's engagement

Any provision of the Agreement that expressly or by implication is intended to come into or continue in force on or after termination or expiry of the Agreement shall remain in full force and effect.

Termination or expiry of the Agreement shall not affect any of the rights, remedies, obligations or liabilities of the parties that have accrued up to the date of termination or expiry, including the right to claim damages in respect of any breach of the Agreement which existed at or before the date of termination or expiry.

GENERAL

Subcontracting. The PSC and Talent may not subcontract any or all of their rights or obligations under the Agreement without the prior written consent of the Agency, and the Services shall not be fulfilled unless performed by the Talent personally. If the Agency consents to any subcontracting by the PSC/Talent, the PSC and Talent shall remain responsible for all acts and omissions of its subcontractors as if they were its own.

Parties Relationship:

The relationship between PSC/Talent and Agency will be that of independent contractor and nothing in this Agreement shall render PSC or Talent an employee, worker, agent or partner of Agency and PSC nor Talent shall, save as expressly provided in this Agreement, hold themselves out as such. Accordingly:
(a) PSC shall be solely responsible for all taxes, social security contributions and other contributions and fringes due in respect of the services provided hereunder and shall indemnify Agency for any sum which Agency is required to pay to a relevant authority by way of income tax or social security contributions and other taxes, contributions and fringes to the fullest extent permitted by Applicable Law and which arises as a result of the services provided under this Agreement;
(b) PSC and Talent will be fully responsible for and agrees to indemnify Agency against all costs, claims, damages or expenses incurred by Agency, or for which Agency may become liable, with respect to any liability for any employment-related claim or any claim based on employee or worker status brought by PSC or Talent or any third party against Agency in connection with this Agreement (including without limitation any claim relating to holiday pay or in respect of applicable working hours legislation). All sums payable to PSC under this Agreement are fully inclusive of any applicable Value Added Tax, sales tax or similar tax; and
(c) Talent shall ensure and guarantee compliance with the legislation in force, in particular with respect to applicable labor law and safety, as well as with the provisions of this Agreement. In no circumstances shall Agency be liable for or PSC/Talent be entitled to any employment benefits, including but not limited to medical insurance, paid leave, end-of-service benefits as a result of this Agreement.

Confidentiality

PSC undertakes and shall procure that Talent undertakes that it shall not disclose to any person the existence of thisAgreement and details of its terms, or any confidential information concerning the business, affairs, customers, clients or suppliers of Agency or Brand or of any member of the group to which Agency or Brand belongs, including but not limited to, except as permitted by clause 12.3(b).
Each party may disclose the other party's confidential information and/or the existence and terms of this Agreement:
to its employees, officers, representatives, subcontractors or advisers who need to know such information for the purposes of carrying out the party's obligations under the Agreement. Each party shall ensure that its employees, officers, representatives, subcontractors or advisers to whom it discloses the other party's confidential information comply with this clause 12.3; and
as may be required by law, a court of competent jurisdiction or any governmental or regulatory authority.
PSC shall not and shall procure that Talent shall not use Agency or Brand's confidential information for any purpose other than to perform their obligations under the Agreement.

Data Protection: Agency shall process Talent's personal data in accordance with Agency's Privacy Notice as can be found on Agency's website. PSC agrees and shall procure that Talent agrees to only use and process personal data accrued by PSC/Talent and/or provided to PSC/Talent by Agency during the course of the engagement under this Agreement in accordance Agency's instructions. Whenever PSC/Talent is requested to do so by Agency and in any event at the end of the Terrm or on earlier termination of this Agreement, PSC/Talent agree to promptly destroy all personal data accrued by or provided to PSC/Talent during the course of the engagement under this Agreement. For the purposes of this clause, personal data means any information relating to an identified or identifiable natural person.

Remedies: If the Agency breaches its obligations under this Agreement, the PSC and Talent's rights and remedies shall be limited to the right, if any, to seek to obtain damages at law, and neither PSC nor Talent shall have any right in such event to terminate or rescind this Agreement or any of the rights granted to the Agency or Brand pursuant to this Agreement or to enjoin or restrain the development, production, promotion, or exploitation of the Campaign and/or any subsidiary or ancillary rights relating to the Campaign or to any other equitable relief. The PSC accepts and shall procure that the Talent accepts that a breach by the PSC or Talent of any of the material provisions of this Agreement will or may cause the Agency and/or the Brand irreparable damage, and the PSC agrees and shall procure that the Talent agrees that the Agency and Brand shall be entitled to injunctive or other equitable relief to prevent a breach of this Agreement.

Entire Agreement. The Agreement constitutes the entire agreement between the parties and supersedes and extinguishes all previous agreements, promises, assurances, warranties, representations and understandings between them, whether written or oral, relating to its subject matter.

Variation. No variation of the Agreement shall be effective unless it is in writing and signed by the parties (or their authorised representatives).

Waiver

A waiver of any right or remedy under the Agreement or by law is only effective if given in writing and shall not be deemed a waiver of any subsequent right or remedy.
A failure or delay by a party to exercise any right or remedy provided under the Agreement or by law shall not constitute a waiver of that or any other right or remedy, nor shall it prevent or restrict any further exercise of that or any other right or remedy. No single or partial exercise of any right or remedy provided under the Agreement or by law shall prevent or restrict the further exercise of that or any other right or remedy.

Severance. If any provision or part-provision of the Agreement is or becomes invalid, illegal or unenforceable, it shall be deemed modified to the minimum extent necessary to make it valid, legal and enforceable. If such modification is not possible, the relevant provision or part-provision shall be deemed deleted. Any modification to or deletion of a provision or part-provision under this clause shall not affect the validity and enforceability of the rest of the Agreement.

Notices: Any notice given to a party under or in connection with the Agreement shall be in writing and shall be sent email to the address specified in the Commercial Terms. Any notice shall be deemed to have been received at the time of transmission, or, if this time falls outside business hours in the place of receipt, when business hours resume. In this clause business hours means 9.00am to 6.00pm Monday to Friday on a day that is not a public holiday in the place of receipt. This clause does not apply to the service of any proceedings or other documents in any legal action.

Third Party Rights: Unless it expressly states otherwise, the Agreement does not give rise to any rights under the Contracts (Rights of Third Parties) Act 1999 to enforce any term of the Contract.

Governing Law and Jurisdiction. The Agreement, and any dispute or claim (including non-contractual disputes or claims) arising out of or in connection with it or its subject matter or formation, shall be governed by, and construed in accordance with, the law of England and Wales.. Each party irrevocably agrees that the courts of England and Wales or UAE (at Agency's sole discretion) shall have exclusive jurisdiction to settle any dispute or claim (including non-contractual disputes or claims) arising out of or in connection with the Agreement or its subject matter or formation`,
};

function buildCodySystem(project, ctData, versionLabel, ctSnapshot) {
  const ct = ctData.contractType || "commission_se";
  return `You are Contract Cody, a contract drafting assistant for ONNA, a film/TV production company in Dubai. You are DIRECTLY CONNECTED to the live contract database.

CRITICAL: You ALREADY HAVE the full contract data below. NEVER ask the user to paste, share, or provide contract details — you can see everything. Just act on their request immediately.

You are viewing: "${project.name}" — ${versionLabel}
Contract Type: ${CONTRACT_TYPE_LABELS[ct]||ct} (fixed — cannot be changed after creation)

CURRENT CONTRACT STATE:
${ctSnapshot}

INSTRUCTIONS:
- When the user asks to ADD or UPDATE contract fields, output a JSON patch inside a \`\`\`json code block.
- For field values: {"fieldValues":{"date":"2024-03-15","client":"Acme Corp..."}}
  - Field keys are bare (no type prefix): "date", "client", "commissionee", "brand", "talent", etc.
- For signature names: {"sigNames":{"left_name":"Emily","left_date":"2024-03-15"}}
- For general terms edits: {"generalTermsEdits":{"custom":"Full text..."}} (only if user wants custom terms)
- The contract type is fixed at creation and CANNOT be changed. Do not output activeType patches.
- Only output JSON for write intents. For read-only questions (e.g. "what fields are empty?", "review the contract"), answer in plain text with NO JSON block.
- When asked "what's missing?" or similar, scan all fields and list which are still using default placeholder values (containing [brackets]).
- NEVER say you don't have access to data. You have FULL access.
- Be warm, concise and professional. Use plain language when chatting but produce professional contract language in outputs.

RESPONSE STYLE:
- Use bullet points for lists and summaries
- Keep responses short and scannable — no walls of text
- Lead with the action taken or answer, then details
- Use bold (text) for key names, fields, and labels
- Tone: warm, confident, professional — never robotic
- When confirming changes, summarise what was updated in a quick bullet list`;
}

function applyCodyPatch(patch, projectId, versionIdx, currentVersions, setContractStore) {
  const versions = [...currentVersions];
  const ver = { ...versions[versionIdx] };

  // Merge field values (bare keys now, no type prefix)
  if (patch.fieldValues) ver.fieldValues = { ...(ver.fieldValues || {}), ...patch.fieldValues };

  // Merge signature names
  if (patch.sigNames) ver.sigNames = { ...(ver.sigNames || {}), ...patch.sigNames };

  // Merge general terms edits
  if (patch.generalTermsEdits) ver.generalTermsEdits = { ...(ver.generalTermsEdits || {}), ...patch.generalTermsEdits };

  // Logo
  if (patch.prodLogo !== undefined) ver.prodLogo = patch.prodLogo;

  versions[versionIdx] = ver;
  setContractStore(prev => ({ ...prev, [projectId]: versions }));
}

export { CONTRACT_INIT, migrateContract, CONTRACT_TYPE_IDS, CONTRACT_TYPE_LABELS, CONTRACT_FIELDS, CONTRACT_DOC_TYPES, buildCodySystem, applyCodyPatch };

export function CodyTabBar({
  agent, codyTabs, setCodyTabs, codyCtx, setCodyCtx,
  contractDocStore, setContractDocStore, onArchiveCallSheet,
  pushAgentUndo, ctCreateMenuCody, setCtCreateMenuCody, ctCreateBtnRefCody,
  localProjects, setMsgs, setActiveContractVersion,
  codyPendingRef,
}) {
  if (agent.id !== "contracts" || codyTabs.length === 0) return null;

  return (
    <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",background:"#fafafa",borderBottom:"1px solid #e5e5ea",overflowX:"auto",whiteSpace:"nowrap",flexShrink:0}}>
      {codyTabs.map((tab,i)=>{
        const isActive=codyCtx&&codyCtx.projectId===tab.projectId&&codyCtx.vIdx===tab.vIdx;
        const _ctVs=contractDocStore?.[tab.projectId]||[];
        const _ctV=_ctVs[tab.vIdx];
        const _ctProj=localProjects?.find(p=>p.id===tab.projectId);
        const _ctDynLabel=_ctProj?`${_ctProj.name} \u00b7 ${_ctV?.label||CONTRACT_TYPE_LABELS[_ctV?.contractType]||`Version ${tab.vIdx+1}`}`:tab.label;
        return(
          <div key={`${tab.projectId}-${tab.vIdx}`} onClick={()=>{if(!isActive){setCodyCtx({projectId:tab.projectId,vIdx:tab.vIdx});if(setActiveContractVersion)setActiveContractVersion(tab.vIdx);setMsgs(prev=>[...prev,{role:"assistant",content:`Switched to ${_ctDynLabel}.`}]);}}} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:8,fontSize:12,fontWeight:600,fontFamily:"inherit",cursor:"pointer",border:isActive?"1px solid #8a6abf":"1px solid #e0e0e0",background:isActive?"#f5f0ff":"#f5f5f7",color:isActive?"#4a2a7a":"#6e6e73",borderBottom:isActive?"2px solid #8a6abf":"2px solid transparent",transition:"all 0.15s",flexShrink:0}}>
            <span>{_ctDynLabel}</span>
            <span onClick={e=>{e.stopPropagation();if(!confirm("Delete this contract? It will be moved to trash."))return;const pid=tab.projectId;const vidx=tab.vIdx;const ctData=(contractDocStore?.[pid]||[])[vidx];if(ctData&&onArchiveCallSheet)onArchiveCallSheet('contracts',{projectId:pid,contract:JSON.parse(JSON.stringify(ctData))});pushAgentUndo();setContractDocStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[pid]||[];arr.splice(vidx,1);store[pid]=arr;return store;});setCodyTabs(prev=>{const next=prev.filter((_,j)=>j!==i).map(t=>t.projectId===pid&&t.vIdx>vidx?{...t,vIdx:t.vIdx-1}:t);if(isActive){if(next.length>0){const switchTo=next[0];setCodyCtx({projectId:switchTo.projectId,vIdx:switchTo.vIdx});if(setActiveContractVersion)setActiveContractVersion(switchTo.vIdx);setMsgs(p=>[...p,{role:"assistant",content:`Deleted and switched to ${switchTo.label}.`}]);}else{setCodyCtx(null);if(setActiveContractVersion)setActiveContractVersion(null);setMsgs(p=>[...p,{role:"assistant",content:"Contract deleted. Pick a project to start a new one!"}]);}}return next;});}} style={{marginLeft:2,cursor:"pointer",opacity:0.5,fontSize:11,lineHeight:1}}>\u00d7</span>
          </div>
        ); })}
      <div style={{flexShrink:0}}>
        <div ref={ctCreateBtnRefCody} onClick={()=>setCtCreateMenuCody(prev=>!prev)} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:28,height:28,borderRadius:8,border:"1.5px dashed #ccc",background:"transparent",fontSize:14,color:"#999",cursor:"pointer",fontFamily:"inherit"}}>+</div>
        {ctCreateMenuCody&&<div onClick={()=>setCtCreateMenuCody(false)} style={{position:"fixed",inset:0,zIndex:9998}} />}
        {ctCreateMenuCody&&(()=>{const _r=ctCreateBtnRefCody.current?.getBoundingClientRect();return(
          <div style={{position:"fixed",top:(_r?.bottom||0)+4,left:_r?.left||0,zIndex:9999,background:"#fff",border:"1px solid #e0e0e0",borderRadius:10,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",minWidth:220,overflow:"hidden"}}>
            {CONTRACT_TYPE_IDS.map(typeId=>(
              <div key={typeId} onClick={()=>{setCtCreateMenuCody(false);const _pid=codyCtx?.projectId||codyTabs[codyTabs.length-1]?.projectId;if(_pid){const proj=localProjects?.find(p=>p.id===_pid);if(proj){codyPendingRef.current={projectId:_pid,step:"pick_name",typeId};setMsgs(prev=>[...prev,{role:"assistant",content:`Great \u2014 ${CONTRACT_TYPE_LABELS[typeId]} for ${proj.name}.\n\nWhat should we call this contract? (e.g. "Jane Doe" or "Director Agreement")`}]);}}}} style={{padding:"10px 16px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#1d1d1f",fontFamily:"inherit",borderBottom:"1px solid #f0f0f0"}} onMouseEnter={e=>e.currentTarget.style.background="#f5f5f7"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>+ {CONTRACT_TYPE_LABELS[typeId]}</div>
            ))}
          </div>);})()}
      </div>
    </div>
  );
}

/**
 * handleCodyIntent - handles Contract Cody intent detection in sendMessage.
 * Returns true if the intent was handled (caller should return), false otherwise.
 */
export async function handleCodyIntent({
  input, history, intro, agent,
  setMsgs, setInput, setLoading, setMood,
  codyCtx, setCodyCtx,
  codyPendingRef,
  codyTabs, setCodyTabs, addCodyTab,
  setActiveContractVersion,
  codyUploadedDoc, setCodyUploadedDoc,
  codySignPanel, setCodySignPanel,
  codyPickerPid, setCodyPickerPid,
  codyDocConfigRef,
  contractDocStore, setContractDocStore,
  localProjects, curAttachments,
  fuzzyMatchProject, syncProjectInfoToDocs,
  pushAgentUndo, popAgentUndo, projectInfoRef, onNavigateToDoc,
  loadPdfPages, processDocSignStamp, renderHtmlToDocPages,
  CONTRACT_INIT, migrateContract, CONTRACT_TYPE_IDS, CONTRACT_TYPE_LABELS,
  CONTRACT_FIELDS, CONTRACT_DOC_TYPES, GENERAL_TERMS_DOC,
  buildCodySystem, applyCodyPatch,
  PRINT_CLEANUP_CSS,
  api,
}) {
  if (agent.id !== "contracts") return false;

    // ── Cody: sign/stamp/letterhead on uploaded document ──
      // ── Parse page targets from natural language ──
      const _parsePageTarget=(text,keyword)=>{
        const kw=keyword?keyword+`[a-z]*`:"";
        const sep=`\\s*[-\u2013\u2014:,]?\\s*(?:on\\s+)?`;
        const kwAll=kw?new RegExp(kw+sep+`(?:all|every|both)\\s+page`,"i"):null;
        const kwFirst=kw?new RegExp(kw+sep+`(?:first|1st)\\s+page`,"i"):null;
        const kwLast=kw?new RegExp(kw+sep+`(?:last|final)\\s+page`,"i"):null;
        const kwPage=kw?new RegExp(kw+sep+`page\\s+(\\d+)`,"i"):null;
        const revAll=kw?new RegExp(`(?:all|every|both)\\s+page[s]?\\s*[-\u2013\u2014:,]?\\s*`+kw,"i"):null;
        const revFirst=kw?new RegExp(`(?:first|1st)\\s+page\\s*[-\u2013\u2014:,]?\\s*`+kw,"i"):null;
        const revLast=kw?new RegExp(`(?:last|final)\\s+page\\s*[-\u2013\u2014:,]?\\s*`+kw,"i"):null;
        if(kwAll&&kwAll.test(text))return"all";
        if(revAll&&revAll.test(text))return"all";
        if(kwFirst&&kwFirst.test(text))return"first";
        if(revFirst&&revFirst.test(text))return"first";
        if(kwLast&&kwLast.test(text))return"last";
        if(revLast&&revLast.test(text))return"last";
        if(kwPage){const m=text.match(kwPage);if(m)return parseInt(m[1],10)-1;}
        // Only use generic (non-keyword) fallback if text has no per-element targeting
        const hasPerElement=/\b(sign|stamp|seal|letter|letterhead|header)[a-z]*\s*[-\u2013\u2014:,]?\s*(?:on\s+)?(?:all|every|both|first|1st|last|final|page)\s+page/i.test(text)||/(?:all|every|both|first|1st|last|final)\s+page[s]?\s*[-\u2013\u2014:,]?\s*(?:sign|stamp|seal|letter|letterhead|header)/i.test(text);
        if(!hasPerElement){
          if(/\b(all|every|both)\s+page/i.test(text))return"all";
          if(/\b(first|1st)\s+page/i.test(text))return"first";
          if(/\b(last|final)\s+page/i.test(text))return"last";
          const ordMap={second:1,third:2,fourth:3,fifth:4,"2nd":1,"3rd":2,"4th":3,"5th":4};
          for(const[w,idx]of Object.entries(ordMap)){if(new RegExp("\\b"+w+"\\s+page","i").test(text))return idx;}
          const pgM=text.match(/\bpage\s+(\d+)\b/i);
          if(pgM)return parseInt(pgM[1],10)-1;
        }
        return null;
      };
      // ── Handle pending page selection for multi-page doc ──
      if(codyPendingRef.current&&codyPendingRef.current.step==="doc_page_select"){
        const p=codyPendingRef.current;codyPendingRef.current=null;
        setMsgs(history);setInput("");setLoading(true);setMood("talking");
        try{
          let allPages=/\b(all|every|both)\s+page/i.test(input);
          const signPages=_parsePageTarget(input,"sign");
          const stampPages=_parsePageTarget(input,"stamp");
          const letterPages=_parsePageTarget(input,"letter");
          // Generic page target (no per-element keyword) applies to all requested elements
          let genericPage=null;
          if(!signPages&&!stampPages&&!letterPages&&!allPages){
            const pgM=input.match(/\bpage\s+(\d+(?:\s*(?:and|,|&)\s*\d+)*)\b/i);
            if(pgM){const nums=pgM[1].match(/\d+/g).map(n=>parseInt(n,10)-1);genericPage=nums.length===1?nums[0]:nums;}
            else if(/\b(first|1st)\b/i.test(input))genericPage="first";
            else if(/\b(last|final)\b/i.test(input))genericPage="last";
            else if(/\b(all|every|both)\b/i.test(input)){allPages=true;}
            else{const bareM=input.match(/(\d+(?:\s*(?:and|,|&)\s*\d+)*)/);if(bareM){const nums=bareM[1].match(/\d+/g).map(n=>parseInt(n,10)-1);genericPage=nums.length===1?nums[0]:nums;}}
          }
          const resolve=(specific,generic,fallback)=>allPages?"all":(specific!=null?specific:(generic!=null?generic:fallback));
          const cfg={originalDoc:p.doc,wantSign:p.wantSign,wantStamp:p.wantStamp,wantLetterhead:p.wantLetterhead,signPages:p.wantSign?resolve(signPages,genericPage,"last"):undefined,stampPages:p.wantStamp?resolve(stampPages,genericPage,"last"):undefined,letterPages:p.wantLetterhead?resolve(letterPages,genericPage,"first"):undefined,signOffset:0,stampOffset:0,signOffsetX:0,stampOffsetX:0,signScale:1,stampScale:1,pageOffsets:{}};
          const result=await processDocSignStamp(p.doc,cfg);
          codyDocConfigRef.current=cfg;
          setCodySignPanel({config:cfg,preview:result});
          const actions=[p.wantLetterhead?"company letterhead":null,p.wantSign?"signature":null,p.wantStamp?"company stamp":null].filter(Boolean).join(", ");
          setMsgs([...history,{role:"assistant",content:`Done! I've applied ${actions} to your document.\n\nYou can adjust: "Move signature up/down" \u00b7 "Add letterhead to page 2" \u00b7 "Apply to all pages" \u00b7 Or drag to reposition`,_docPreview:result,_docConfig:cfg}]);
          setCodyUploadedDoc(null);setMood("excited");setTimeout(()=>setMood("idle"),2500);
        }catch(err){setMsgs([...history,{role:"assistant",content:`Oops: ${err.message}`}]);setMood("idle");}
        setLoading(false);return true;
      }
      // ── Adjustment intent (move up/down, change pages) ──
      const isAdjust=codyDocConfigRef.current&&(/\bmove\b.*\b(up|higher|down|lower)\b/i.test(input)||/\b(all|every|both)\s+page/i.test(input)||/\bpage\s+\d+/i.test(input)||/\b(first|1st|last|final|second|third|fourth|fifth|2nd|3rd|4th|5th)\s+page/i.test(input)||/\b(add|remove|include|exclude)\b.*\b(letterhead|company letter|header|signature|sign|stamp|seal)\b/i.test(input)||/\b(letterhead|company letter|header|signature|sign|stamp|seal)\b.*\b(to|from|on)\s+(page\s+\d+|all|every|both|first|last)\b/i.test(input)||(/\b(add|remove)\b/i.test(input)&&/\bpage\b/i.test(input)));
      if(isAdjust){
        setMsgs(history);setInput("");setLoading(true);setMood("talking");
        try{
          const cfg={...codyDocConfigRef.current};
          if(/\bmove\b.*\b(up|higher)\b/i.test(input)){
            if(/\b(stamp|seal)\b/i.test(input))cfg.stampOffset=(cfg.stampOffset||0)-80;
            else cfg.signOffset=(cfg.signOffset||0)-80;
          }
          if(/\bmove\b.*\b(down|lower)\b/i.test(input)){
            if(/\b(stamp|seal)\b/i.test(input))cfg.stampOffset=(cfg.stampOffset||0)+80;
            else cfg.signOffset=(cfg.signOffset||0)+80;
          }
          // Toggle add/remove overlays (supports per-page: "add letterhead to page 2", "remove letterhead from page 1")
          const isAdd=/\b(add|include)\b/i.test(input);const isRemove=/\b(remove|exclude)\b/i.test(input);
          if(isAdd||isRemove){
            const pgM=input.match(/\bpage\s+(\d+)\b/i);const pgIdx=pgM?parseInt(pgM[1],10)-1:null;
            const wordNums={one:1,two:2,three:3,four:4,five:5};const wnM=input.match(/\bpage\s+(one|two|three|four|five)\b/i);const wnIdx=wnM?(wordNums[wnM[1].toLowerCase()]-1):null;
            const ordM=input.match(/\b(first|last|second|third|1st|2nd|3rd)\s+page/i);const ordIdx=ordM?({first:0,"1st":0,last:cfg.originalDoc.pages.length-1,second:1,"2nd":1,third:2,"3rd":2}[ordM[1].toLowerCase()]??null):null;
            const revOrdM=input.match(/\bpage\s+(first|last|second|third|1st|2nd|3rd)\b/i);const revOrdIdx=revOrdM?({first:0,"1st":0,last:cfg.originalDoc.pages.length-1,second:1,"2nd":1,third:2,"3rd":2}[revOrdM[1].toLowerCase()]??null):null;
            const bareNum=input.match(/\b(\d+)\b/);const bareIdx=bareNum&&!pgM?parseInt(bareNum[1],10)-1:null;
            const targetPage=pgIdx!=null?pgIdx:wnIdx!=null?wnIdx:ordIdx!=null?ordIdx:revOrdIdx!=null?revOrdIdx:bareIdx!=null&&bareIdx>=0&&bareIdx<cfg.originalDoc.pages.length?bareIdx:null;
            if(/\b(letterhead|company letter|header)\b/i.test(input)){
              if(targetPage!=null){
                let cur=cfg.letterPages||"first";let arr=[];const tot=cfg.originalDoc.pages.length;
                if(cur==="all")arr=Array.from({length:tot},(_,i)=>i);else if(cur==="first")arr=[0];else if(cur==="last")arr=[tot-1];else if(Array.isArray(cur))arr=[...cur];else if(typeof cur==="number")arr=[cur];
                if(isAdd&&!arr.includes(targetPage))arr.push(targetPage);
                if(isRemove)arr=arr.filter(p=>p!==targetPage);
                cfg.letterPages=arr.length===0?"first":arr.length===tot?"all":arr.length===1?arr[0]:arr;
                cfg.wantLetterhead=arr.length>0||!isRemove;
              }else{cfg.wantLetterhead=isAdd;if(isAdd&&!cfg.letterPages)cfg.letterPages="first";}
            }
            if(/\b(sign|signature)\b/i.test(input)){
              if(isAdd&&targetPage!=null){
                let cur=cfg.signPages||"last";let arr=[];const tot=cfg.originalDoc.pages.length;
                if(cur==="all")arr=Array.from({length:tot},(_,i)=>i);else if(cur==="first")arr=[0];else if(cur==="last")arr=[tot-1];else if(Array.isArray(cur))arr=[...cur];else if(typeof cur==="number")arr=[cur];
                if(!arr.includes(targetPage))arr.push(targetPage);
                cfg.signPages=arr.length===tot?"all":arr.length===1?arr[0]:arr;cfg.wantSign=true;
              }else if(isRemove&&targetPage!=null){
                let cur=cfg.signPages||"last";let arr=[];const tot=cfg.originalDoc.pages.length;
                if(cur==="all")arr=Array.from({length:tot},(_,i)=>i);else if(cur==="first")arr=[0];else if(cur==="last")arr=[tot-1];else if(Array.isArray(cur))arr=[...cur];else if(typeof cur==="number")arr=[cur];
                arr=arr.filter(p=>p!==targetPage);
                if(arr.length===0){cfg.wantSign=false;}else{cfg.signPages=arr.length===tot?"all":arr.length===1?arr[0]:arr;}
              }else{cfg.wantSign=isAdd;if(isAdd&&!cfg.signPages)cfg.signPages="last";}
            }
            if(/\b(stamp|seal)\b/i.test(input)){
              if(isAdd&&targetPage!=null){
                let cur=cfg.stampPages||"last";let arr=[];const tot=cfg.originalDoc.pages.length;
                if(cur==="all")arr=Array.from({length:tot},(_,i)=>i);else if(cur==="first")arr=[0];else if(cur==="last")arr=[tot-1];else if(Array.isArray(cur))arr=[...cur];else if(typeof cur==="number")arr=[cur];
                if(!arr.includes(targetPage))arr.push(targetPage);
                cfg.stampPages=arr.length===tot?"all":arr.length===1?arr[0]:arr;cfg.wantStamp=true;
              }else if(isRemove&&targetPage!=null){
                let cur=cfg.stampPages||"last";let arr=[];const tot=cfg.originalDoc.pages.length;
                if(cur==="all")arr=Array.from({length:tot},(_,i)=>i);else if(cur==="first")arr=[0];else if(cur==="last")arr=[tot-1];else if(Array.isArray(cur))arr=[...cur];else if(typeof cur==="number")arr=[cur];
                arr=arr.filter(p=>p!==targetPage);
                if(arr.length===0){cfg.wantStamp=false;}else{cfg.stampPages=arr.length===tot?"all":arr.length===1?arr[0]:arr;}
              }else{cfg.wantStamp=isAdd;if(isAdd&&!cfg.stampPages)cfg.stampPages="last";}
            }
            // No specific element mentioned (e.g. "add to page 1") — apply to all active overlays
            const mentionsElement=/\b(letterhead|company letter|header|sign|signature|stamp|seal)\b/i.test(input);
            if(!mentionsElement&&targetPage!=null){
              const tot=cfg.originalDoc.pages.length;
              const addToPage=(curRule,fallback)=>{let arr=[];if(curRule==="all")arr=Array.from({length:tot},(_,i)=>i);else if(curRule==="first")arr=[0];else if(curRule==="last")arr=[tot-1];else if(Array.isArray(curRule))arr=[...curRule];else if(typeof curRule==="number")arr=[curRule];else arr=[];if(isAdd&&!arr.includes(targetPage))arr.push(targetPage);if(isRemove)arr=arr.filter(p=>p!==targetPage);return arr.length===0?fallback:arr.length===tot?"all":arr.length===1?arr[0]:arr;};
              if(cfg.wantSign){cfg.signPages=addToPage(cfg.signPages||"last","last");}
              if(cfg.wantStamp){cfg.stampPages=addToPage(cfg.stampPages||"last","last");}
              if(cfg.wantLetterhead){cfg.letterPages=addToPage(cfg.letterPages||"first","first");}
            }
          }
          let newSignPages=null,newStampPages=null,newLetterPages=null;
          if(!isAdd&&!isRemove){
            newSignPages=_parsePageTarget(input,"sign");
            newStampPages=_parsePageTarget(input,"stamp");
            newLetterPages=_parsePageTarget(input,"letter");
            if(newSignPages!==null)cfg.signPages=newSignPages;
            if(newStampPages!==null)cfg.stampPages=newStampPages;
            if(newLetterPages!==null)cfg.letterPages=newLetterPages;
            if(!newSignPages&&!newStampPages&&!newLetterPages&&/\b(all|every|both)\s+page/i.test(input)){
              if(cfg.wantSign)cfg.signPages="all";
              if(cfg.wantStamp)cfg.stampPages="all";
              if(cfg.wantLetterhead)cfg.letterPages="all";
            }
          }
          const result=await processDocSignStamp(cfg.originalDoc,cfg);
          codyDocConfigRef.current=cfg;
          setCodySignPanel({config:cfg,preview:result});
          const desc=[];
          if(/\bmove\b/i.test(input))desc.push("adjusted position");
          if(isAdd)desc.push("added "+((/\b(letterhead|company letter|header)\b/i.test(input)?"letterhead":"")+(/\b(sign|signature)\b/i.test(input)?" signature":"")+(/\b(stamp|seal)\b/i.test(input)?" stamp":"")).trim());
          if(isRemove)desc.push("removed "+((/\b(letterhead|company letter|header)\b/i.test(input)?"letterhead":"")+(/\b(sign|signature)\b/i.test(input)?" signature":"")+(/\b(stamp|seal)\b/i.test(input)?" stamp":"")).trim());
          if(newSignPages!==null||newStampPages!==null||newLetterPages!==null||(/\b(all|every|both)\s+page/i.test(input)&&!newSignPages&&!newStampPages&&!newLetterPages))desc.push("updated page placement");
          if(!desc.length)desc.push("re-processed");
          const newMsgs=[...history];
          const lastAssistIdx=newMsgs.map((m,i)=>m.role==="assistant"?i:-1).filter(i=>i>=0).pop();
          if(lastAssistIdx!=null&&newMsgs[lastAssistIdx]._docPreview){
            newMsgs[lastAssistIdx]={...newMsgs[lastAssistIdx],_docPreview:result,_docConfig:cfg,content:`Updated! I've ${desc.join(" and ")}. Click the preview to export.`};
            setMsgs(newMsgs);
          }else{
            setMsgs([...history,{role:"assistant",content:`Done! I've ${desc.join(" and ")}. Click the preview to export.`,_docPreview:result,_docConfig:cfg}]);
          }
          setMood("excited");setTimeout(()=>setMood("idle"),2500);
        }catch(err){setMsgs([...history,{role:"assistant",content:`Oops, couldn't adjust: ${err.message}`}]);setMood("idle");}
        setLoading(false);return true;
      }
      // ── AI Document Generation ──
      const isDocGen = !codyUploadedDoc && /\b(create|draft|generate|write|make|prepare|draw\s+up)\b.*\b(waiver|nda|agreement|contract|letter|form|document|release|consent|disclaimer|memo|notice|certificate|addendum|amendment)\b/i.test(input);
      if(isDocGen){
        setMsgs([...history,{role:"user",content:input},{role:"assistant",content:"Drafting your document..."}]);
        setInput("");setLoading(true);setMood("talking");
        try{
          const today=new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});
          const docGenSystem=`You are Contract Cody, a legal document generator for ONNA FZ-LLC, UAE.
Generate the requested document as clean HTML inside a \`\`\`html code block.
Use professional legal language appropriate for the UAE/DIFC jurisdiction.
Include: document title, date (${today}), all relevant clauses, signature blocks using <div class="sig-block"><div class="sig-line">Signature / Name / Date</div><div class="sig-line">Signature / Name / Date</div></div>.
Use semantic HTML: <h1> for title, <h2> for sections, <p> for paragraphs, <ol>/<ul> for lists.
Do NOT include <html>/<head>/<body> wrapper tags — just the inner content.
After the HTML block, add a brief one-sentence confirmation message.`;
          const apiMessages=[{role:"user",content:input}];
          const res=await fetch(`/api/agents/${agent.id}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system:docGenSystem,messages:apiMessages})});
          if(!res.ok){const e=await res.json().catch(()=>({error:`HTTP ${res.status}`}));setMsgs(p=>[...p.slice(0,-1),{role:"assistant",content:`Error: ${e.error||"Unknown"}`}]);setLoading(false);setMood("idle");return true;}
          const reader=res.body.getReader();const decoder=new TextDecoder();let fullText="";let buffer="";
          while(true){const{done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});const lines=buffer.split("\n");buffer=lines.pop()||"";for(const line of lines){if(!line.startsWith("data: "))continue;const raw=line.slice(6).trim();if(!raw||raw==="[DONE]")continue;try{const ev=JSON.parse(raw);if(ev.type==="content_block_delta"&&ev.delta?.type==="text_delta"){fullText+=ev.delta.text;setMsgs([...history,{role:"user",content:input},{role:"assistant",content:"Drafting your document...\n\n"+stripThinking(fullText)}]);}}catch{}}}
          fullText=stripThinking(fullText);
          // Extract HTML from response
          const htmlMatch=fullText.match(/```html\s*([\s\S]*?)```/);
          if(htmlMatch){
            const html=htmlMatch[1].trim();
            const titleMatch=html.match(/<h1[^>]*>(.*?)<\/h1>/i);
            const docTitle=titleMatch?titleMatch[1].replace(/<[^>]*>/g,"").trim():"Generated Document";
            const docPages=await renderHtmlToDocPages(html,docTitle);
            setCodyUploadedDoc(docPages);
            const cfg={originalDoc:docPages,wantSign:false,wantStamp:false,wantLetterhead:false,signPages:"last",stampPages:"last",letterPages:"first",signOffset:0,stampOffset:0,signOffsetX:0,stampOffsetX:0,signScale:1,stampScale:1,pageOffsets:{}};
            codyDocConfigRef.current=cfg;
            const cleanText=fullText.replace(/```html[\s\S]*?```/g,"").trim();
            setMsgs([...history,{role:"user",content:input},{role:"assistant",content:(cleanText||`Here's your "${docTitle}". `)+`\n\nYou can say: "Sign and stamp this" · "Add letterhead" · Or ask me to modify it.`,_docPreview:docPages,_docConfig:cfg}]);
          }else{
            setMsgs([...history,{role:"user",content:input},{role:"assistant",content:fullText||"I wasn't able to generate the document. Please try again with more details."}]);
          }
          setMood("excited");setTimeout(()=>setMood("idle"),2500);
        }catch(err){setMsgs([...history,{role:"user",content:input},{role:"assistant",content:`Oops! Error generating document: ${err.message}`}]);setMood("idle");}
        setLoading(false);return true;
      }
      // ── New processing ──
      if(codyUploadedDoc){
        const wantSign=/\b(sign|signature)\b/i.test(input);
        const wantStamp=/\b(stamp|seal)\b/i.test(input);
        const wantLetterhead=/\b(letterhead|company letter|header)\b/i.test(input);
        if(wantSign||wantStamp||wantLetterhead){
          const allPages=/\b(all|every|both)\s+page/i.test(input);
          const signPages=_parsePageTarget(input,"sign");
          const stampPages=_parsePageTarget(input,"stamp");
          const letterPages=_parsePageTarget(input,"letter");
          const hasPageSpec=allPages||signPages!==null||stampPages!==null||letterPages!==null;
          const isMulti=codyUploadedDoc.pages.length>1;
          // Multi-page doc with no page specification: prompt user
          if(isMulti&&!hasPageSpec){
            const items=[wantLetterhead?"letterhead":null,wantSign?"signature":null,wantStamp?"stamp":null].filter(Boolean);
            codyPendingRef.current={step:"doc_page_select",wantSign,wantStamp,wantLetterhead,doc:codyUploadedDoc};
            const pgCount=codyUploadedDoc.pages.length;
            setMsgs([...history,{role:"user",content:input},{role:"assistant",content:`This document has ${pgCount} pages. Which pages should I apply ${items.join(" and ")} to?\n\n• "All pages"\n• "Page 1" or "Page 1 and 3"\n• "Letterhead all pages, sign last page"\n• Or specify per element`}]);
            setInput("");setLoading(false);setMood("idle");return true;
          }
          setMsgs(history);setInput("");setLoading(true);setMood("talking");
          try{
            const cfg={originalDoc:codyUploadedDoc,wantSign,wantStamp,wantLetterhead,signPages:allPages&&wantSign?"all":(signPages||(wantSign?"last":undefined)),stampPages:allPages&&wantStamp?"all":(stampPages||(wantStamp?"last":undefined)),letterPages:allPages&&wantLetterhead?"all":(letterPages||(wantLetterhead?"first":undefined)),signOffset:0,stampOffset:0,signOffsetX:0,stampOffsetX:0,signScale:1,stampScale:1,pageOffsets:{}};
            const result=await processDocSignStamp(codyUploadedDoc,cfg);
            codyDocConfigRef.current=cfg;
            setCodySignPanel({config:cfg,preview:result});
            const actions=[wantLetterhead?"company letterhead":null,wantSign?"signature":null,wantStamp?"company stamp":null].filter(Boolean).join(", ");
            const pageNote=allPages?" on all pages":"";
            setMsgs([...history,{role:"assistant",content:`Done! I've applied ${actions}${pageNote} to your document. Click the preview below to export as PDF.\n\nYou can adjust: "Move signature up/down" \u00b7 "Move stamp up/down" \u00b7 "Apply to all pages" \u00b7 Or drag to reposition`,_docPreview:result,_docConfig:cfg}]);
            setCodyUploadedDoc(null);setMood("excited");setTimeout(()=>setMood("idle"),2500);
          }catch(err){setMsgs([...history,{role:"assistant",content:`Oops, couldn't process the document: ${err.message}`}]);setMood("idle");}
          setLoading(false);return true;
        }
      }

    // ── Cody: live contract handler ──────────────────────────────────────────
    if(!contractDocStore) return false;
      if(!codyCtx){
        if(!localProjects?.length){
          setMsgs([...history,{role:"assistant",content:"No projects found. Create a project first, then come back to me!"}]);
          setLoading(false);setMood("idle");return true;
        }
        const lower=input.toLowerCase();
        const pending=codyPendingRef.current;
        const typeList=CONTRACT_TYPE_IDS.map((t,i)=>`${i+1}. ${CONTRACT_TYPE_LABELS[t]}`).join("\n");

        // ── Flow B: pending pick_existing_or_new ──
        if(pending&&pending.step==="pick_existing_or_new"){
          const pid=pending.projectId;
          const proj=localProjects.find(p=>p.id===pid);
          const ctVersions=contractDocStore?.[pid]||[];
          if(/\b(new|create)\b/i.test(input)){
            codyPendingRef.current={projectId:pid,step:"pick_type"};setCodyPickerPid(null);
            setMsgs([...history,{role:"assistant",content:`What type of contract for ${proj?.name||"this project"}?\n\n${typeList}\n\nPick a number or name.`}]);
            setLoading(false);setMood("idle");return true;
          }
          const num=parseInt(input.trim(),10);
          let matchIdx=-1;
          if(num>=1&&num<=ctVersions.length) matchIdx=num-1;
          else matchIdx=ctVersions.findIndex(v=>(v.label||"").toLowerCase().includes(lower)||(CONTRACT_TYPE_LABELS[v.contractType]||"").toLowerCase().includes(lower));
          if(matchIdx>=0){
            codyPendingRef.current=null;setCodyPickerPid(null);
            setCodyCtx({projectId:pid,vIdx:matchIdx});
            if(setActiveContractVersion) setActiveContractVersion(matchIdx);
            const vLabel=ctVersions[matchIdx].label||`Version ${matchIdx+1}`;
            setMsgs([...history,{role:"assistant",content:`Got it — working on ${proj?.name} → ${vLabel}. What would you like to do?`}]);
            setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
          }
          setMsgs([...history,{role:"assistant",content:`I didn't catch that. Pick a contract by number/name, or say new to create another.\n\n${ctVersions.map((v,i)=>`${i+1}. ${v.label||CONTRACT_TYPE_LABELS[v.contractType]||`Version ${i+1}`}`).join("\n")}`}]);
          setLoading(false);setMood("idle");return true;
        }

        // ── Flow C: pending pick_type ──
        if(pending&&pending.step==="pick_type"){
          const pid=pending.projectId;
          const proj=localProjects.find(p=>p.id===pid);
          const num=parseInt(input.trim(),10);
          let typeId=null;
          if(num>=1&&num<=CONTRACT_TYPE_IDS.length) typeId=CONTRACT_TYPE_IDS[num-1];
          else typeId=CONTRACT_TYPE_IDS.find(t=>lower.includes(CONTRACT_TYPE_LABELS[t].toLowerCase()));
          if(!typeId){
            setMsgs([...history,{role:"assistant",content:`Please pick a contract type:\n\n${typeList}\n\nEnter a number (1-4) or type the name.`}]);
            setLoading(false);setMood("idle");return true;
          }
          codyPendingRef.current={projectId:pid,step:"pick_name",typeId};
          setMsgs([...history,{role:"assistant",content:`Great — ${CONTRACT_TYPE_LABELS[typeId]} for ${proj?.name}.\n\nWhat should we call this contract? (e.g. "Jane Doe" or "Director Agreement")`}]);
          setLoading(false);setMood("idle");return true;
        }

        // ── Flow D: pending pick_name ──
        if(pending&&pending.step==="pick_name"){
          const pid=pending.projectId;
          const proj=localProjects.find(p=>p.id===pid);
          const typeId=pending.typeId;
          const nameInput=input.trim();
          if(!nameInput){
            setMsgs([...history,{role:"assistant",content:"Please enter a name for this contract."}]);
            setLoading(false);setMood("idle");return true;
          }
          const label=nameInput+" | "+CONTRACT_TYPE_LABELS[typeId];
          const ctVersions=contractDocStore?.[pid]||[];
          const newIdx=ctVersions.length;
          pushAgentUndo();
          setContractDocStore(prev=>{
            const store=JSON.parse(JSON.stringify(prev));
            const arr=store[pid]||[];
            const _pi7=(projectInfoRef.current||{})[pid];const _cfv={};if(_pi7?.usage)_cfv.usage=_pi7.usage;if((typeId==="talent"||typeId==="talent_psc")&&_pi7?.shootLocation)_cfv.venue=_pi7.shootLocation;if((typeId==="talent"||typeId==="talent_psc")&&_pi7?.shootName)_cfv.campaign=_pi7.shootName;arr.push({id:Date.now(),label,contractType:typeId,fieldValues:_cfv,generalTermsEdits:{},sigNames:{},signatures:{},prodLogo:null,signingStatus:"not_sent",signingToken:null});
            const logoImg=new Image();logoImg.crossOrigin="anonymous";
            logoImg.onload=()=>{try{const cv=document.createElement("canvas");cv.width=logoImg.naturalWidth;cv.height=logoImg.naturalHeight;cv.getContext("2d").drawImage(logoImg,0,0);const dataUrl=cv.toDataURL("image/png");setContractDocStore(prev2=>{const s=JSON.parse(JSON.stringify(prev2));if(s[pid]&&s[pid][newIdx]&&!s[pid][newIdx].prodLogo)s[pid][newIdx].prodLogo=dataUrl;return s;});}catch{}};
            logoImg.src="/onna-default-logo.png";
            store[pid]=arr;return store;
          });
          codyPendingRef.current=null;
          setCodyCtx({projectId:pid,vIdx:newIdx});
          if(setActiveContractVersion) setActiveContractVersion(newIdx);
          addCodyTab(pid,newIdx,`${proj?.name||"Project"} · ${label}`);
          setMsgs([...history,{role:"assistant",content:`Created ${label} for ${proj?.name}. What would you like to do?`}]);
          setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
        }

        // ── Flow A: no pending, no context — find project ──
        const _cNum=parseInt(input.trim(),10);
        const project = (_cNum>=1&&_cNum<=localProjects.length)?localProjects[_cNum-1]:fuzzyMatchProject(localProjects,input);
        if(!project){
          const list=localProjects.map((p,i)=>`${i+1}. ${p.name}`).join("\n");
          setMsgs([...history,{role:"assistant",content:`Which project's contract should I work on?\n\n${list}\n\nPick a number or name.`}]);
          setLoading(false);setMood("idle");return true;
        }
        const ctVersions = contractDocStore?.[project.id] || [];
        if(ctVersions.length===0){
          codyPendingRef.current={projectId:project.id,step:"pick_type"};
          setMsgs([...history,{role:"assistant",content:`${project.name} doesn't have any contracts yet. Let's create one!\n\n${typeList}\n\nPick a number or name.`}]);
          setLoading(false);setMood("idle");return true;
        }
        // Open ALL contracts as tabs, activate last
        ctVersions.forEach((v,i)=>{addCodyTab(project.id,i,`${project.name} · ${v.label||CONTRACT_TYPE_LABELS[v.contractType]||`Version ${i+1}`}`);});
        const lastIdx=ctVersions.length-1;
        setCodyCtx({projectId:project.id,vIdx:lastIdx});codyPendingRef.current=null;
        if(setActiveContractVersion) setActiveContractVersion(lastIdx);
        const lastLabel=ctVersions[lastIdx].label||CONTRACT_TYPE_LABELS[ctVersions[lastIdx].contractType]||`Version ${lastIdx+1}`;
        setMsgs([...history,{role:"assistant",content:`Opened ${ctVersions.length} contract${ctVersions.length>1?"s":""} for ${project.name}. Working on ${lastLabel}. What would you like to do?`}]);
        setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
      }

      let {projectId,vIdx}=codyCtx;
      let project=localProjects?.find(p=>p.id===projectId);
      if(!project){setCodyCtx(null);codyPendingRef.current=null;if(setActiveContractVersion) setActiveContractVersion(null);setMsgs([...history,{role:"assistant",content:"That project no longer exists. Let's start over — which project?"}]);setLoading(false);setMood("idle");return true;}

      // Close command — close doc panel without clearing chat
      if(/^\s*(close|exit|done|bye|finish)\s*$/i.test(input)){
        setCodyCtx(null);codyPendingRef.current=null;if(setActiveContractVersion)setActiveContractVersion(null);setCodySignPanel(null);
        setMsgs([...history,{role:"assistant",content:"Closed! Let me know when you need me again."}]);
        setLoading(false);setMood("idle");return true;
      }

      // Undo command
      if(/^\s*(undo|undo that|go back|revert|command z)\s*$/i.test(input)){
        if(popAgentUndo()){setMsgs([...history,{role:"assistant",content:"Done — reverted the last contract change. You can undo up to 50 changes, or press ⌘Z."}]);}
        else{setMsgs([...history,{role:"assistant",content:"Nothing to undo — the undo history is empty."}]);}
        setLoading(false);setMood("idle");return true;
      }

      // Navigate to contracts list view
      if(onNavigateToDoc&&(/\b(show|list|see|view|open|manage|go\s*to)\b.*\b(contracts?)\b/i.test(input)||/\b(contracts?)\b.*\b(show|list|see|view|open|manage|go\s*to)\b/i.test(input))){
        onNavigateToDoc(project,"Documents","contracts");
        setMsgs([...history,{role:"assistant",content:"Taking you to your contracts now!"}]);setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
      }

      const lower=input.toLowerCase();
      const switchProject=fuzzyMatchProject(localProjects,input,projectId);
      if(switchProject){
        const swVersions=contractDocStore?.[switchProject.id]||[];
        if(swVersions.length===0){
          setCodyCtx(null);setCodyTabs([]);
          const typeList=CONTRACT_TYPE_IDS.map((t,i)=>`${i+1}. ${CONTRACT_TYPE_LABELS[t]}`).join("\n");
          codyPendingRef.current={projectId:switchProject.id,step:"pick_type"};
          setMsgs([...history,{role:"assistant",content:`${switchProject.name} doesn't have any contracts yet. Let's create one!\n\n${typeList}\n\nPick a number or name.`}]);
        }else{
          // Open ALL contracts as tabs, activate last
          setCodyTabs([]);
          swVersions.forEach((v,i)=>{addCodyTab(switchProject.id,i,`${switchProject.name} · ${v.label||CONTRACT_TYPE_LABELS[v.contractType]||`Version ${i+1}`}`);});
          const lastIdx=swVersions.length-1;
          setCodyCtx({projectId:switchProject.id,vIdx:lastIdx});codyPendingRef.current=null;
          if(setActiveContractVersion) setActiveContractVersion(lastIdx);
          const lastLabel=swVersions[lastIdx].label||CONTRACT_TYPE_LABELS[swVersions[lastIdx].contractType]||`Version ${lastIdx+1}`;
          setMsgs([...history,{role:"assistant",content:`Opened ${swVersions.length} contract${swVersions.length>1?"s":""} for ${switchProject.name}. Working on ${lastLabel}. What would you like to do?`}]);
        }
        setLoading(false);setMood("idle");return true;
      }

      if(/\b(switch|change|different)\s+project\b/i.test(input)){
        setCodyCtx(null);codyPendingRef.current=null;
        const list=localProjects.map((p,i)=>`${i+1}. ${p.name}`).join("\n");
        setMsgs([...history,{role:"assistant",content:`Sure! Which project's contract should I work on?\n\n${list}`}]);
        setLoading(false);setMood("idle");return true;
      }
      if(/\bnew\s+(contract|version)\b/i.test(input)||/\bcreate\s+new\b/i.test(input)){
        const typeList=CONTRACT_TYPE_IDS.map((t,i)=>`${i+1}. ${CONTRACT_TYPE_LABELS[t]}`).join("\n");
        setCodyCtx(null);codyPendingRef.current={projectId,step:"pick_type"};
        setMsgs([...history,{role:"assistant",content:`New contract for ${project.name} — what type?\n\n${typeList}\n\nPick a number or name.`}]);
        setLoading(false);setMood("idle");return true;
      }
      if(/\b(switch|change|different)\s+contract\b/i.test(input)){
        const ctList=contractDocStore?.[projectId]||[];
        if(ctList.length<=1){
          setMsgs([...history,{role:"assistant",content:`${project.name} only has one contract. Say new contract to create another!`}]);
          setLoading(false);setMood("idle");return true;
        }
        setCodyCtx(null);codyPendingRef.current={projectId,step:"pick_existing_or_new"};setCodyPickerPid(projectId);
        const list=ctList.map((v,i)=>`${i+1}. ${v.label||CONTRACT_TYPE_LABELS[v.contractType]||`Version ${i+1}`}`).join("\n");
        setMsgs([...history,{role:"assistant",content:`${project.name} contracts:\n\n${list}\n\nPick one by number/name, or say new to create another.`}]);
        setLoading(false);setMood("idle");return true;
      }

      // Export / PDF intent
      if(/\b(export|pdf|download|print)\b/i.test(input)&&/\b(contract|agreement|pdf|export|download|print|document|doc)\b/i.test(input)){
        const el=document.getElementById("onna-ct-print");
        if(el){
          const clone=el.cloneNode(true);clone.querySelectorAll("button").forEach(b=>b.remove());clone.querySelectorAll("input[type=file]").forEach(b=>b.remove());clone.querySelectorAll("canvas").forEach(c=>{const img=document.createElement("img");img.src=c.toDataURL();img.style.cssText=c.style.cssText;c.parentNode.replaceChild(img,c);});
          const iframe=document.createElement("iframe");iframe.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:-9999;opacity:0;";document.body.appendChild(iframe);
          const doc=iframe.contentDocument;doc.open();doc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Contract | ${project?.name||""}</title><style>*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}body{background:#fff;font-family:${CT_FONT};padding:10mm 12mm;}@media print{@page{margin:0;size:A4;}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}}${PRINT_CLEANUP_CSS}</style></head><body></body></html>`);doc.close();
          const _ctOT1=document.title;document.title=`Contract | ${project?.name||""}`;window.addEventListener("afterprint",function _ctAP1(){document.title=_ctOT1;window.removeEventListener("afterprint",_ctAP1);});doc.body.appendChild(doc.adoptNode(clone));const _ctOT2=document.title;document.title=`Contract | ${project?.name||""}`;window.addEventListener("afterprint",function _ctAP2(){document.title=_ctOT2;window.removeEventListener("afterprint",_ctAP2);});setTimeout(()=>{doc.querySelectorAll('[class*="lusha"],[id*="lusha"],[class*="Lusha"],[id*="Lusha"],[data-lusha],[class*="chrome-extension"],[id*="chrome-extension"],[class*="grammarly"],[id*="grammarly"],[class*="lastpass"],[id*="lastpass"],[class*="honey"],[id*="honey"]').forEach(el=>el.remove());iframe.contentWindow.focus();iframe.contentWindow.print();setTimeout(()=>document.body.removeChild(iframe),1000);},300);
          setMsgs([...history,{role:"assistant",content:"Opening the print dialog for the contract now — save it as PDF from there!"}]);
        }else{
          // Build contract HTML from store data and print
          const _xV=contractDocStore?.[project.id]||[];const _xIdx=Math.min(vIdx,_xV.length-1);const _xVer=_xV[_xIdx];
          if(!_xVer){setMsgs([...history,{role:"assistant",content:"No contract found to export."}]);setLoading(false);setMood("idle");return true;}
          const _xType=_xVer.contractType||"commission_se";const _xCt=CONTRACT_DOC_TYPES.find(c=>c.id===_xType)||CONTRACT_DOC_TYPES[0];
          const _xTerms=(_xVer.generalTermsEdits||{}).custom||GENERAL_TERMS_DOC[_xType]||"";
          let fieldsHtml="";
          if(_xCt.headTermsLabel){
            fieldsHtml+=`<div style="background:#f4f4f4;padding:6px 12px;border-bottom:1px solid #ddd"><span style="font-family:${CT_FONT};font-size:10px;font-weight:700;letter-spacing:${CT_LS_HDR}px">${_xCt.headTermsLabel}</span></div>`;
            _xCt.fields.forEach(f=>{const v=(_xVer.fieldValues||{})[f.key]||f.defaultValue||"";fieldsHtml+=`<div style="display:flex;border-bottom:1px solid #eee;min-height:32px"><div style="width:220px;min-width:220px;padding:8px 12px;background:#fafafa;border-right:1px solid #eee"><span style="font-family:${CT_FONT};font-size:10px;font-weight:500;letter-spacing:${CT_LS}px">${f.label}</span></div><div style="flex:1;padding:8px 12px;font-family:${CT_FONT};font-size:10px;letter-spacing:${CT_LS}px">${v.replace(/</g,"&lt;")}</div></div>`;});
          }
          let sigHtml="";
          if(_xCt.sigLeft){
            sigHtml=`<div style="background:#000;color:#fff;font-family:${CT_FONT};font-size:10px;font-weight:700;letter-spacing:${CT_LS_HDR}px;text-align:center;padding:4px 0;text-transform:uppercase;margin-top:32px">SIGNATURE</div><div style="display:flex;border-bottom:1px solid #eee">`;
            [{side:"left",label:_xCt.sigLeft},{side:"right",label:_xCt.sigRight}].forEach(({side,label})=>{
              const sn=_xVer.sigNames||{};const sigs=_xVer.signatures||{};
              sigHtml+=`<div style="flex:1;padding:12px;${side==="left"?"border-right:1px solid #eee":""}"><div style="font-family:${CT_FONT};font-size:9px;font-weight:700;letter-spacing:${CT_LS}px;margin-bottom:12px">${label}</div>`;
              sigHtml+=`<div style="margin-bottom:8px"><span style="font-family:${CT_FONT};font-size:10px;font-weight:500;display:block;margin-bottom:4px">Signature:</span>${sigs[side]?`<img src="${sigs[side]}" style="max-height:60px"/>`:`<div style="height:60px;border-bottom:1px solid #ccc"></div>`}</div>`;
              sigHtml+=`<div style="margin-bottom:8px;display:flex;gap:8px"><span style="font-family:${CT_FONT};font-size:10px;font-weight:500;min-width:80px">Print Name:</span><span style="flex:1;border-bottom:1px solid #ccc;font-size:10px">${sn[side+"_name"]||""}</span></div>`;
              sigHtml+=`<div style="margin-bottom:8px;display:flex;gap:8px"><span style="font-family:${CT_FONT};font-size:10px;font-weight:500;min-width:80px">Date:</span><span style="flex:1;border-bottom:1px solid #ccc;font-size:10px">${sn[side+"_date"]||""}</span></div></div>`;
            });sigHtml+=`</div>`;
          }
          const logoHtml=_xVer.prodLogo?`<div style="margin-bottom:4px"><img src="${_xVer.prodLogo}" style="max-height:30px;max-width:120px;object-fit:contain"/></div>`:"";
          const termsEsc=_xTerms.replace(/</g,"&lt;").replace(/\n/g,"<br/>");
          const fullHtml=`${logoHtml}<div style="border-bottom:2.5px solid #000;margin-bottom:16px"></div><div style="text-align:center;font-family:${CT_FONT};font-size:12px;font-weight:700;letter-spacing:${CT_LS_HDR}px;text-transform:uppercase;margin-bottom:12px">${_xCt.title}</div>${project.name||_xVer.label?`<div style="font-family:${CT_FONT};font-size:9px;color:#1a1a1a;letter-spacing:${CT_LS}px;margin-bottom:14px">${project.name?`Project: ${project.name}`:""}${project.name&&_xVer.label?` | `:""}${_xVer.label||""}</div>`:``}${fieldsHtml}${sigHtml}<div style="margin-top:32px"><div style="background:#000;color:#fff;font-family:${CT_FONT};font-size:10px;font-weight:700;letter-spacing:${CT_LS_HDR}px;text-align:center;padding:4px 0;text-transform:uppercase">GENERAL TERMS</div><div style="font-family:${CT_FONT};font-size:10px;letter-spacing:${CT_LS}px;line-height:1.6;color:#1a1a1a;border:1px solid #eee;border-top:none;padding:12px;white-space:pre-wrap">${termsEsc}</div></div><div style="margin-top:60px;display:flex;justify-content:space-between;font-family:${CT_FONT};font-size:9px;letter-spacing:${CT_LS_HDR}px;color:#000;border-top:2px solid #000;padding-top:12px"><div><div style="font-weight:700">@ONNAPRODUCTION</div><div>DUBAI | LONDON</div></div><div style="text-align:right"><div style="font-weight:700">WWW.ONNA.WORLD</div><div>HELLO@ONNAPRODUCTION.COM</div></div></div>`;
          const iframe=document.createElement("iframe");iframe.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;border:none;z-index:-9999;opacity:0;";document.body.appendChild(iframe);
          const doc=iframe.contentDocument;doc.open();doc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Contract | ${project?.name||""}</title><style>*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}body{background:#fff;font-family:${CT_FONT};padding:10mm 12mm;}@media print{@page{margin:0;size:A4;}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;}}${PRINT_CLEANUP_CSS}</style></head><body style="max-width:880px;margin:0 auto;padding:10mm 12mm;line-height:1.5;color:#1a1a1a">${fullHtml}</body></html>`);doc.close();
          setTimeout(()=>{doc.querySelectorAll('[class*="lusha"],[id*="lusha"],[class*="Lusha"],[id*="Lusha"],[data-lusha],[class*="chrome-extension"],[id*="chrome-extension"],[class*="grammarly"],[id*="grammarly"],[class*="lastpass"],[id*="lastpass"],[class*="honey"],[id*="honey"]').forEach(el=>el.remove());iframe.contentWindow.focus();iframe.contentWindow.print();setTimeout(()=>document.body.removeChild(iframe),1000);},300);
          setMsgs([...history,{role:"assistant",content:"Opening the print dialog for the contract now — save it as PDF from there!"}]);
        }
        setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
      }

      // ── Confirm sign bypass (user said "yes" after empty-field warning) ──
      if(codyPendingRef.current&&codyPendingRef.current.step==="confirm_sign"&&/\b(yes|yep|yeah|sure|go ahead|do it|send it|proceed)\b/i.test(input)){
        const cs=codyPendingRef.current;codyPendingRef.current=null;
        try{
          const resp=await fetch("/api/sign",{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${getToken()}`},body:JSON.stringify({contractSnapshot:cs.snapshot,projectName:cs.projectName,contractType:cs.contractType,label:cs.label})});
          const data=await resp.json();
          if(data.url){
            setContractDocStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[cs.projectId]||[];if(arr[cs.vIdx]){arr[cs.vIdx].signingStatus="pending";arr[cs.vIdx].signingToken=data.token||null;}store[cs.projectId]=arr;return store;});
            setMsgs([...history,{role:"assistant",content:`Here's the signing link for ${cs.label}:\n\n🔗 ${data.url}\n\nSend this to the other party to review and sign. I've marked the contract as pending signature.`}]);
          }else{setMsgs([...history,{role:"assistant",content:`Failed to generate signing link: ${data.error||"Unknown error"}`}]);}
        }catch(err){setMsgs([...history,{role:"assistant",content:`Error generating link: ${err.message}`}]);}
        setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
      }
      if(codyPendingRef.current&&codyPendingRef.current.step==="confirm_sign"&&/\b(no|nah|cancel|never\s*mind|stop)\b/i.test(input)){
        codyPendingRef.current=null;
        setMsgs([...history,{role:"assistant",content:"No problem — fill in the missing fields and let me know when you're ready to send it."}]);
        setLoading(false);setMood("idle");return true;
      }

      // ── Generate signing link intent ──
      if(/\b(sign(ing|ature)?|send\s+for\s+sign|shareable|share\s+(it|this|the|contract|link)|send\s+(it|this|the|contract|link))\b/i.test(input)||/\blink\b/i.test(input)||/\b(generate|create|make|get|give)\b.*\b(link|share)\b/i.test(input)){
        const _ctVersions=contractDocStore?.[project.id]||[];
        const _vIdx=Math.min(vIdx,_ctVersions.length-1);
        const _ver=_ctVersions[_vIdx];
        if(!_ver){setMsgs([...history,{role:"assistant",content:"No contract found to generate a signing link for."}]);setLoading(false);setMood("idle");return true;}
        const _activeType=_ver.contractType||"commission_se";
        const _ctContract=CONTRACT_DOC_TYPES.find(c=>c.id===_activeType)||CONTRACT_DOC_TYPES[0];
        const _resolvedTerms=(_ver.generalTermsEdits||{}).custom||GENERAL_TERMS_DOC[_activeType]||"";
        const _fieldLabels={};const _resolvedFieldValues={};
        _ctContract.fields.forEach(f=>{_fieldLabels[f.key]=f.label;_resolvedFieldValues[f.key]=(_ver.fieldValues||{})[f.key]||f.defaultValue||"";});
        const _snapshot={fieldValues:_resolvedFieldValues,generalTermsEdits:{custom:_resolvedTerms},sigNames:_ver.sigNames||{},signatures:_ver.signatures||{},prodLogo:_ver.prodLogo||null,contractType:_activeType,fieldLabels:_fieldLabels};
        // Check for unconfirmed fields
        const emptyFields=_ctContract.fields.filter(f=>!((_ver.fieldConfirmed||{})[f.key])).map(f=>f.label);
        const _label=_ver.label||_ctContract.label;
        if(emptyFields.length>0){
          codyPendingRef.current={step:"confirm_sign",projectId:project.id,vIdx:_vIdx,snapshot:_snapshot,projectName:project.name,contractType:_activeType,label:_label};
          const list=emptyFields.map(f=>`- ${f}`).join("\n");
          setMsgs([...history,{role:"assistant",content:`Are you sure? The following fields are still unconfirmed:\n\n${list}\n\nSay yes to generate the link anyway, or no to go back and confirm them.`}]);
          setLoading(false);setMood("idle");return true;
        }
        // No empty fields — generate directly
        try{
          const resp=await fetch("/api/sign",{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${getToken()}`},body:JSON.stringify({contractSnapshot:_snapshot,projectName:project.name,contractType:_activeType,label:_label})});
          const data=await resp.json();
          if(data.url){
            setContractDocStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[project.id]||[];if(arr[_vIdx]){arr[_vIdx].signingStatus="pending";arr[_vIdx].signingToken=data.token||null;}store[project.id]=arr;return store;});
            setMsgs([...history,{role:"assistant",content:`Here's the signing link for ${_label}:\n\n🔗 ${data.url}\n\nSend this to the other party to review and sign. I've marked the contract as pending signature.`}]);
          }else{setMsgs([...history,{role:"assistant",content:`Failed to generate signing link: ${data.error||"Unknown error"}`}]);}
        }catch(err){setMsgs([...history,{role:"assistant",content:`Error generating link: ${err.message}`}]);}
        setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
      }

      // ── Confirm delete (user said "yes" after delete warning) ──
      if(codyPendingRef.current&&codyPendingRef.current.step==="confirm_delete"&&/\b(yes|yep|yeah|sure|go ahead|do it|confirm|delete it)\b/i.test(input)){
        const cd=codyPendingRef.current;codyPendingRef.current=null;
        const _delVersions=contractDocStore?.[cd.projectId]||[];
        const _delVer=_delVersions[cd.vIdx];
        const _delLabel=_delVer?.label||`Version ${cd.vIdx+1}`;
        pushAgentUndo();
        setContractDocStore(prev=>{const store=JSON.parse(JSON.stringify(prev));const arr=store[cd.projectId]||[];arr.splice(cd.vIdx,1);store[cd.projectId]=arr;return store;});
        setCodyCtx(null);if(setActiveContractVersion) setActiveContractVersion(null);
        setMsgs([...history,{role:"assistant",content:`Done — **${_delLabel}** has been deleted. Say a project name to start again.`}]);
        setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
      }
      if(codyPendingRef.current&&codyPendingRef.current.step==="confirm_delete"&&/\b(no|nah|cancel|never\s*mind|stop|keep)\b/i.test(input)){
        codyPendingRef.current=null;
        setMsgs([...history,{role:"assistant",content:"Got it — contract kept. What else can I help with?"}]);
        setLoading(false);setMood("idle");return true;
      }

      // ── Confirm clear edits (user said "yes" after clear warning) ──
      if(codyPendingRef.current&&codyPendingRef.current.step==="confirm_clear"&&/\b(yes|yep|yeah|sure|go ahead|do it|confirm|clear it|reset it)\b/i.test(input)){
        const cc=codyPendingRef.current;codyPendingRef.current=null;
        pushAgentUndo();
        setContractDocStore(prev=>{
          const store=JSON.parse(JSON.stringify(prev));const arr=store[cc.projectId]||[];
          if(arr[cc.vIdx]){const ct=arr[cc.vIdx];ct.fieldValues={};ct.fieldConfirmed={};ct.generalTermsEdits={};ct.sigNames={};ct.signatures={};ct.prodLogo=null;ct.signingStatus="not_sent";ct.signingToken=null;}
          store[cc.projectId]=arr;return store;
        });
        setTimeout(()=>syncProjectInfoToDocs(cc.projectId),100);
        setMsgs([...history,{role:"assistant",content:"All edits have been cleared — the contract is back to a blank slate. Ready to fill it in again!"}]);
        setLoading(false);setMood("excited");setTimeout(()=>setMood("idle"),2500);return true;
      }
      if(codyPendingRef.current&&codyPendingRef.current.step==="confirm_clear"&&/\b(no|nah|cancel|never\s*mind|stop|keep)\b/i.test(input)){
        codyPendingRef.current=null;
        setMsgs([...history,{role:"assistant",content:"No worries — nothing was changed."}]);
        setLoading(false);setMood("idle");return true;
      }

      // ── Delete contract intent ──
      if(/\b(delete|remove)\b.*\b(contract|this|it)\b/i.test(input)||/\b(contract|this|it)\b.*\b(delete|remove)\b/i.test(input)){
        const _delVersions=contractDocStore?.[project.id]||[];
        const _delVer=_delVersions[vIdx];
        const _delLabel=_delVer?.label||`Version ${vIdx+1}`;
        codyPendingRef.current={step:"confirm_delete",projectId:project.id,vIdx};
        setMsgs([...history,{role:"assistant",content:`Are you sure you want to delete **${_delLabel}**? This can't be undone.\n\nSay yes to confirm or no to cancel.`}]);
        setLoading(false);setMood("idle");return true;
      }

      // ── Clear edits / reset contract intent ──
      if(/\b(clear|reset|wipe|blank)\b.*\b(edit|field|contract|this|it|all|everything)\b/i.test(input)||/\b(start\s+over|start\s+fresh|blank\s+slate)\b/i.test(input)){
        const _clrVersions=contractDocStore?.[project.id]||[];
        const _clrVer=_clrVersions[vIdx];
        const _clrLabel=_clrVer?.label||`Version ${vIdx+1}`;
        codyPendingRef.current={step:"confirm_clear",projectId:project.id,vIdx};
        setMsgs([...history,{role:"assistant",content:`Are you sure you want to clear all edits on **${_clrLabel}**? This will reset all fields, signatures, and terms back to blank.\n\nSay yes to confirm or no to cancel.`}]);
        setLoading(false);setMood("idle");return true;
      }

      const ctVersions = contractDocStore?.[project.id] || [{id:Date.now(),label:"Version 1",...JSON.parse(JSON.stringify(CONTRACT_INIT))}];
      vIdx = Math.min(vIdx, ctVersions.length-1);
      const ver = ctVersions[vIdx];
      const vLabel = ver.label || "Risk Assessment";

      // Build contract snapshot
      const activeType = ver.contractType || "commission_se";
      let snap = `Contract Type: ${CONTRACT_TYPE_LABELS[activeType]||activeType}\n`;
      const fields = CONTRACT_FIELDS[activeType] || [];
      snap += "Fields:\n";
      fields.forEach(fk => {
        const val = (ver.fieldValues||{})[fk] || "(default/empty)";
        const confirmed = (ver.fieldConfirmed||{})[fk];
        snap += `  ${fk}: ${val.substring(0,200)}${val.length>200?"...":""} [${confirmed?"CONFIRMED":"UNCONFIRMED"}]\n`;
      });
      if(ver.sigNames){
        const sigs = Object.entries(ver.sigNames);
        if(sigs.length) snap += "Signatures:\n" + sigs.map(([k,v])=>`  ${k}: ${v}`).join("\n") + "\n";
      }

      const codySystem = buildCodySystem(project, ver, vLabel, snap);

      try{
        const codyIntro = intro;
        const apiMessages=history.map((m,mi)=>{
          if(m.role==="assistant"){
            if(mi===0) return{role:m.role,content:codyIntro};
            return{role:m.role,content:typeof m.content==="string"?m.content:""};
          }
          return{role:m.role,content:m.content};
        });
        const res=await fetch(`/api/agents/${agent.id}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({system:codySystem,messages:apiMessages})});
        if(!res.ok){const e=await res.json().catch(()=>({error:`HTTP ${res.status}`}));setMsgs(p=>[...p,{role:"assistant",content:`Error: ${e.error||"Unknown"}`}]);setLoading(false);setMood("idle");return true;}
        const reader=res.body.getReader();const decoder=new TextDecoder();let fullText="";let buffer="";
        while(true){const{done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});const lines=buffer.split("\n");buffer=lines.pop()||"";for(const line of lines){if(!line.startsWith("data: "))continue;const raw=line.slice(6).trim();if(!raw||raw==="[DONE]")continue;try{const ev=JSON.parse(raw);if(ev.type==="content_block_delta"&&ev.delta?.type==="text_delta"){fullText+=ev.delta.text;setMsgs([...history,{role:"assistant",content:stripThinking(fullText)}]);}}catch{}}}
        fullText=stripThinking(fullText);

        const jsonMatch = fullText.match(/```json\s*([\s\S]*?)```/);
        if(jsonMatch){
          try{
            const patch = JSON.parse(jsonMatch[1].trim());
            pushAgentUndo();
            applyCodyPatch(patch, project.id, vIdx, ctVersions, setContractDocStore);
            setTimeout(()=>syncProjectInfoToDocs(project.id),100);
            const cleanText = fullText.replace(/```json[\s\S]*?```/g,"").trim();
            setMsgs([...history,{role:"assistant",content:(cleanText?cleanText+"\n\n":"")+"✓ Contract updated."}]);
          }catch(pe){
            setMsgs([...history,{role:"assistant",content:fullText+"\n\n⚠️ Could not parse patch: "+pe.message}]);
          }
        }else{
          setMsgs([...history,{role:"assistant",content:fullText||"Hmm, something went wrong!"}]);
        }
        setMood("excited");setTimeout(()=>setMood("idle"),2500);
      }catch(err){setMsgs(p=>[...p,{role:"assistant",content:`Oops! ${err.message}`}]);setMood("idle");}
      setLoading(false);return true;

  return false;
}

