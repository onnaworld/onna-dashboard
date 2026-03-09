import React from "react";

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
