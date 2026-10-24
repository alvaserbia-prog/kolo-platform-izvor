> **Unofficial translation.** This English version is provided for convenience only. The legally authoritative text is the Serbian original; in case of any discrepancy, the Serbian version prevails.

# KOLO Whitepaper

*A Participatory Common-Good System*

# Summary

Communities seeking to organise their own exchange face three problems that no existing model solves simultaneously: scaling, trust, and regulatory framework. Barter does not scale. Time banks and LETS systems require trust they cannot sustain once they outgrow a local group. Local currencies are, by virtue of their structural characteristics, susceptible to classification as financial instruments, thereby falling under regulatory frameworks that were never designed for them. The development of digital infrastructure, the emergence of commons-based models, and the institutional recognition of the social economy at the EU and UN level are creating conditions in which a comprehensive solution becomes feasible.

KOLO is a participatory common-good system that addresses these problems through contribution ledgering — recording who contributed, how much, and in what way, through formalised rules embedded in software.

At the centre of the system is the common good — a collective good belonging to all users over which no individual, including the founder, holds an individual property right, and which does not constitute collective ownership in the sense of the applicable property-law categories of Serbian law. Contributions and position are recorded through the Protocol and its two accounting units: POEN and ZRNO. The Protocol is the technical mechanism of the common good — it keeps the ledger, calculates relationships, and executes the rules set by people.

The integrity of the system rests on a proof-of-reality model — a chain of confirmations based on personal acquaintance or on a conversation after a call — in which participants establish the reality and continuity of new users; the verifier does not guarantee that the same person has no other account — that is established by the Foundation, by comparing data and contacting the person. This model is a deliberate design decision that minimises the collection of personal data, in keeping with the data-minimisation principle built into the system.

Two actors surround the common good. The KOLO Foundation is the legal instrument — a legal entity registered in Sombor under the Law on Endowments and Foundations, which gives the common good and the Protocol a legal form recognisable by the state and the law, receives monetary donations in dinars, and holds the infrastructure on which the Protocol operates. The Foundation does not own the system. The KOLO Community consists of all users in the system — they use it, contribute to it, and together take care of the common good, and they participate in governance through the Upper Kolo.

The Community finances the Foundation through dinar donations. The Foundation spends those funds on infrastructure and programmes. Dinar funds do not enter the internal accounting system — there is no conversion of dinars into POENs or of POENs into dinars. A donor's contribution is recorded in POENs, but that record is not a counter-performance for the donation — they are two legally independent acts (Chapter 4).

The Protocol keeps the ledger through two accounting units. POEN records contribution — entries are made exclusively by the Protocol, users have no property right over them, and POEN cannot be converted into money or used outside the system. ZRNO records position — the total number is fixed at one million, ZRNO is non-transferable between users, and a Kolo keeper — a Kolo member to whom ZRNO is recorded — may use it for participation in governance or for position in the accounting system. The accounting coefficient between the two units is an administrative figure that the Protocol calculates daily (Chapter 6).

The system is modular. The core — Foundation, Protocol, POEN, ZRNO, users, proof of reality, financial and operational contribution — operates independently. Additional modules are activated according to need and system readiness. Governance follows a path of progressive decentralisation — from the founders and the Foundation in the first phase, to Gornje Kolo (Upper Kolo), which arises automatically upon the activation of ZRNO as the system's governing body, composed of the Kolo keepers who have activated ZRNO (Chapter 10). The content of the system is licensed under CC BY-SA 4.0, the software under AGPL-3.0.

The Foundation is the data controller within the meaning of the Personal Data Protection Law — it determines the purposes and means of processing — but does not store the personal data of platform users in its own databases: all user data are stored on the Protocol's infrastructure in pseudonymous form. The system collects only the data necessary for its operation, and the Foundation ensures the implementation of protective measures on the infrastructure on which the data reside.

The legal position of the system — including classification under the Law on Digital Assets, the Law on Payment Services, and the Law on the Capital Market — is discussed in Chapters 4 and 6.

This document describes the system's architecture, accounting framework, organisational structure, modules, governance, incentive mechanisms, data protection, and the legal position of each element. It is intended for regulatory bodies, the academic community, prospective users, and anyone who wishes to understand what KOLO is — and, equally important, what it is not.

# 1. Problem

The costs of coordination decline as digital infrastructure develops. The number of people seeking models of work and collaboration outside the classic employer–employee relationship is growing. Local economies face a phenomenon documented in the local-multiplier literature — value created within a community leaves it before it can be used there (Sacks, 2002; NEF, 2002). In these conditions, communities can take greater responsibility for their own sustainability — but to do so they need a comprehensive system that integrates scaling, trust, and regulatory compliance, and which does not exist in current models.

Communities seeking to organise their own exchange face three problems that no existing model solves simultaneously.

**Scaling.** Direct exchange — barter — works between two people who have what the other needs, at the same time, in the same place. That condition is rarely met. Time banks, which record hours of labour as the unit of exchange, resolve the problem of simultaneous need, but in their basic form assume that every hour of labour is equally valuable — an hour of accounting and an hour of mowing the lawn (Cahn, 2004). This limits the complexity of exchange the system can support. LETS systems (Local Exchange Trading Systems) allow more flexible exchange within a closed group, but empirically remain local and small — once they exceed a certain number of users, they lose cohesion because trust among members becomes diluted (Seyfang, 2006; North, 2007). Local currencies and mutual-credit systems introduce a more formal structure, but require institutional support and often depend on convertibility into the national currency, thereby remaining tied to the very financial framework they seek to complement — the Bristol Pound (discontinued in 2021) and Sardex in Sardinia (restructured in 2022) illustrate those limits.

**Trust.** Every exchange system requires users to trust that their contribution will be recognised and that they will not be exploited. In small groups, trust is built face to face. As a system grows, personal trust ceases to be sufficient — an institutionalised mechanism is needed that replaces personal acquaintance with every member (cf. Luhmann, 1979, on the distinction between personal and systemic trust). Traditionally, that role is taken by either the state (through regulation and coercion) or the market (through price as a signal and contract as protection). Other mechanisms exist — reputational systems, social capital, network effects — but none of them provides a community with a set of rules that is simultaneously transparent, predictable, and applied without individual discretion. Communities seeking to organise their own exchange need precisely such a mechanism: formalised rules embedded in the system itself.

**Regulatory framework.** Even when a community solves the problems of scaling and trust, it faces a legal framework designed for financial instruments, payment services, and digital assets. Any internal ledgering system that resembles money, currency, or a token risks being classified as something requiring a licence, supervision, or compliance with rules that were never intended for participatory common-good systems. Local currencies and complementary systems across Europe have faced this problem with varying outcomes — Chiemgauer in Germany operates within a clear regulatory treatment (Thiel, 2012), WIR in Switzerland is regulated as a bank (Stodder, 2009), and the Bristol Pound collapsed under operational and regulatory pressure. A community wishing to organise its own exchange through contribution ledgering must consider from day one how its system will be classified in legal practice — not retrospectively, but as part of the design.

These three problems are mutually dependent: solving any two without the third does not yield a sustainable system. A system that scales without a trust mechanism falls apart as soon as it outgrows the local group. A system with trust but without scaling remains an initiative without broader impact. A system that scales and has trust but does not address the regulatory framework is stopped or constrained by a legal system that does not recognise it.

Attempts to solve these problems have a long history. Silvio Gesell proposed Freigeld at the beginning of the twentieth century — money with a built-in holding cost (demurrage), designed to encourage circulation rather than accumulation (Gesell, 1916). Thomas Greco systematised the principles of mutual credit and complementary currencies, showing that communities can organise exchange without bank intermediation (Greco, 2009). The neo-mutualist tradition, developed in the writings of Kevin Carson and other authors who combine Proudhon's classical mutualism with contemporary cooperative and digital tools, sought models in which users govern the system they use (Carson, 2007) — KOLO grows out of that tradition.

Contemporary research has offered partial solutions. Elinor Ostrom demonstrated empirically that communities can manage common goods without privatisation and without state control — provided that clear rules of access, contribution, and decision-making exist (Ostrom, 1990). Yochai Benkler described commons-based peer production as a mode of organising production based on shared resources and voluntary contribution, neither market-based nor state-directed (Benkler, 2006). Trebor Scholz's platform cooperativism transfers cooperative principles to digital platforms (Scholz, 2016). The open cooperativism of Kostakis and Bauwens combines open protocols, cooperative structures, and common good at the centre (Bauwens, Kostakis and Pazaitis, 2019). Sensorica in Montreal developed the Open Value Network — a system of open contribution ledgering in which every contribution is recorded and valued through value accounting (Braun and Hummel, 2019). Enspiral in New Zealand uses a foundation to govern the infrastructure of a coalition of mission-driven entities (Enspiral Foundation, 2016).

Each of these models solves part of the problem. None solves all three simultaneously. Mutual-credit systems struggle to scale beyond specific institutional conditions — even WIR, the most successful example with over 60,000 members, operates as a regulated bank, not as a participatory system. Benkler's commons-based peer production model does not address the regulatory framework as a design element — specific projects such as Linux and Wikipedia resolve this ad hoc, through legal entities formed after the fact. Ostrom's principles describe the conditions for governing common goods but do not offer an implementation framework for a digital participatory system. Platform cooperatives solve ownership but do not solve contribution ledgering. The open cooperativism of Kostakis and Bauwens integrates open protocols and common good but does not address the regulatory position of the system in a specific jurisdiction. Sensorica's Open Value Network lacks a legal instrument that explicitly addresses the risk of regulatory classification of contribution records as financial instruments. Enspiral's foundation solves the legal form, but without an internal accounting system and contribution ledgering that would structure participation.

These models have not remained purely in the academic sphere. Over the past decade, international institutions have recognised the social economy — the broader category into which participatory common-good systems functionally fit — as a legitimate direction of economic development. The European Commission adopted the Social Economy Action Plan in 2021 with measures for the period 2021–2030, and the EU Council adopted a Recommendation on the framework conditions for the social economy in 2023. The UN General Assembly adopted the first resolution on the social and solidarity economy in 2023 (A/RES/77/281), and the International Labour Organization formally defined this sector at the 110th session of the International Labour Conference in 2022. For Serbia, which is aligning its legislation with the EU acquis in the accession process, this framework is not abstract — it is the regulatory direction into which Serbia is entering. A detailed analysis of this institutional framework is provided in Appendix A.

KOLO is positioned in the institutional direction that the EU, the UN, and the ILO are actively developing — participatory governance, the common good, foundations and cooperatives as legal instruments. The difference is that KOLO attempts to address all three problems — scaling, trust, and regulatory framework — in a single integrated system, with contribution ledgering as the central mechanism.

The chapter that follows describes the vision of that solution — what KOLO is, where it sits in relation to existing models, and on what principles it rests.

# 2. Vision

The question of how to organise resources and systems that matter to more than one person at a time has three well-known answers — each with its own limitations.

The first is private property. Someone owns a resource, decides how it is used, and bears the consequences of that decision. This model promotes efficiency and accountability, but creates asymmetry — the owner has control, and everyone else has access only on the owner's terms. When this principle is applied to exchange systems, the result is a platform whose owner extracts value from the interactions created by its users.

The second is state ownership. The resource belongs to everyone indirectly, through an institution that holds it on behalf of citizens. This model ensures access, but introduces bureaucracy, distance between users and decisions, and dependence on political will. When the state assumes the role of guarantor of exchange, the result is a regulated financial system — stable, but slow, expensive, and inaccessible to communities seeking to organise their own exchange according to their own rules.

The third is open access without structure — what Garrett Hardin called the tragedy of the commons (Hardin, 1968). The resource is available to all, no one tends it, and everyone has an incentive to exploit it before others do. This model ends in the exhaustion of the resource. Hardin's conclusion was that the commons could not survive without privatisation or state control — a conclusion that proved incorrect, but which shaped public policy for decades.

Elinor Ostrom demonstrated empirically that this conclusion is not correct (Ostrom, 1990). Communities around the world — from Swiss Alpine pastures to Japanese fishing villages — have successfully managed common goods for centuries, without privatisation and without the state. The condition is that clear rules exist — Ostrom formalised them as eight design principles, among which the key ones are: clearly defined boundaries of access, rules adapted to local conditions, mechanisms for collective decision-making, and graduated sanctions for violations. The commons does not fail because it is shared. It fails when it has no structure.

KOLO starts from this insight. The common good can be the centre of a system — not as an abstract idea, but as a concrete organisational structure with rules, a ledger, and a legal form. The architecture of the KOLO system is designed with the aim of addressing all eight of Ostrom's design principles — not by analogy, but as structural elements built into the Protocol, governance, and legal framework of the system. A mapping of each principle to specific elements of the KOLO architecture is provided in Appendix E.

In the KOLO system, the common good is not a resource that is consumed — a field being grazed or fish being caught. It is the system itself — the Protocol, the rules, the infrastructure, the content, the contribution ledger. Unlike the classic commons that is rivalrous — where one person's use diminishes another's benefit — the system's core — software, rules, content, infrastructure — is non-rivalrous: use by one user does not diminish availability for others (cf. Hess and Ostrom, 2007, on digital common goods). The system also has a positive network effect (cf. Katz and Shapiro, 1985) — the more people use it, the more valuable the system becomes for all who participate in it, because the number of possible exchanges grows, the volume of the ledger grows, and the capacity of the common good grows.

But a non-rivalrous common good has its own problem. If use is free and unlimited, who maintains it? Who finances the infrastructure? Who makes decisions? Open-source software, the best-known example of a non-rivalrous common good, has faced these questions for decades. Projects that survive — Linux, Wikipedia, Apache — survive because they developed structures of governance, financing, and decision-making. But those structures emerged iteratively and post hoc, often in response to crises rather than as part of the initial design. Many other projects have not survived precisely because they never established those structures.

KOLO answers this question through ledgering. The system records who contributes, how much they contribute, and how they contribute. That ledger is not the private property of the user — the user has no property right over the record of their contribution. But the ledger enables the system to recognise contribution, to measure it, and on that basis to structure participation in governance. The ledger is a consequence of activity — the Protocol records that a contribution occurred, but the record itself is not a transferable asset or the property of the user.

KOLO differs from related models in that it integrates elements they address only partially. Unlike private property, no one owns the system — not the founder, not the Foundation, not individual users; the common good is the good of all users, but not in the sense of collective ownership over which they would have a right of disposal. Unlike state ownership, the system does not depend on political will, budgets, or bureaucracy — the Foundation is a legal instrument, not an owner, and the Community finances the Foundation, not the other way around. Unlike the open-source model, KOLO has an explicit contribution-ledgering mechanism and a governance structure activated on the basis of that contribution — an open-source project records who wrote the code, KOLO records every form of contribution and on that basis structures the entire system.

From crypto projects it differs in that KOLO has no token traded on a market, no promise of financial return, and no speculative element — records in the Protocol are a ledger, not an asset, and contribution is the only way of acquiring a position in the system. The Protocol records a donor's contribution in POENs, but donation is neither a necessary nor a privileged path to ZRNO inscription — the same threshold applies to all activities, including those that require no dinar donation whatsoever, and the legal act of donation and the administrative act of ledgering are separate (Chapter 4, Chapter 6). From platform cooperativism it differs in that KOLO is not a platform owned by users that offers services to a market — KOLO is an internal accounting system in which exchange takes place within the community, and the relationship with the external economy runs exclusively through dinar donations to the Foundation.

The vision of the KOLO system is the common good with structure. A system in which position is neither altruistic nor speculative, but ledgered. A system in which contribution is not invisible, but is also not ownership. A system that promises no return, but whose benefit for users changes with community activity — that change is a consequence of the accounting coefficient, not a guarantee made by any party.

The chapters that follow describe how that design works — the common good with rules, a ledger, a legal form, and a regulatory position.

# 3. Common good and protocol

The common good in the KOLO system has a concrete content. It comprises: the software on which the system operates, the rules under which it functions, the contribution ledger of all users, and the content generated within the system. The infrastructure on which these elements exist — servers, databases, network equipment — is not a constituent part of the common good in the same sense, but it is the operational prerequisite without which the common good cannot function; its maintenance is a service obligation of the Foundation (Chapter 5). All of this together — software, rules, contribution ledger, content — is the common good. A collective good belonging to all users in the system, over which no individual, including the founder, holds an individual property right, and which does not constitute collective ownership in the sense of the applicable property-law categories — users have neither a right of disposal over the common good nor a right to a share in it. The concept of the common good (commons) in the KOLO system corresponds to the category that Elinor Ostrom defined as a resource managed by a community under its own rules, without privatisation and without state control (Ostrom, 1990), extended to digital common resources in the sense of Hess and Ostrom (2007).

The common good is not in the ownership of any single actor in the system — not the founder, not the Foundation, not individual users. Everyone who participates in the system has access to the common good and uses it under equal conditions. Those conditions are not arbitrary — they are defined by rules set by people and changed through the governance processes described in Chapter 10 of this document. The legal mechanisms that ensure the common good remains collective — licences AGPL-3.0 for software and CC BY-SA 4.0 for content — are described in the licences section at the end of this chapter.

The common good is not static. It changes with every activity in the system — every exchange, every contribution, every verification adds data to the ledger and thereby updates the state of the common good. Every such change takes place through the Protocol, which ensures consistency and traceability.

## Protocol

The Protocol is the technical mechanism of the common good — a set of rules translated into software that performs four functions.

Ledgering. It records every activity in the system — who contributed, what, when, and how much. The ledger is the permanent record of the state of the common good.

Accounting. It calculates the accounting coefficient between accounting units on the basis of the state of the ledger. The coefficient follows from pre-defined rules and data recorded by the Protocol — it is not set by any individual.

Rule enforcement. When a participant meets the conditions for ZRNO inscription, the Protocol executes it. When an exchange takes place, it updates the ledger. When an accounting period arrives, it calculates the new coefficient. Every action is automatic — the Protocol applies the rules, it does not interpret them.

Integrity. It ensures the consistency of the ledger — total records conform to the rules, no record arises outside the defined mechanisms, and retroactive modification of the ledger history is not possible. This is a design rule guaranteed by the software architecture of the centralised ledger (Chapter 4), not a property of distributed infrastructure — technical measures are described in Appendix D.

The Protocol does not make decisions about which rules apply. Rules are set by people — in the current phase by the founder and the Foundation, in a later phase by the Upper Kolo through the processes described in Chapter 10. The Protocol is the instrument of those decisions, not their source.

The four functions of the Protocol — ledgering, accounting, rule enforcement, and integrity preservation — directly address several of the eight design principles for governing common goods formalised by Elinor Ostrom (1990): clearly defined boundaries (user verification, Chapter 7), rules adapted to local conditions (parameters set by people, not an algorithm), monitoring mechanisms (record of every activity), and graduated sanctions (defined in the system's rules, Chapter 7). A detailed mapping of all eight principles to the KOLO architecture is provided in Appendix E.

## Accounting units of the Protocol

The Protocol keeps the ledger through two accounting units: POEN and ZRNO.

POEN records contribution and other forms of participation in the common good. The Protocol records a contribution when a user contributes to the common good through a donation, sponsorship, operational contribution, or verification of users in the chain of confirmations — in those cases the record is entered in the contributor's ledger entry. In addition, contribution is recorded in POENs through the growth of Circles and Cooperatives (Modules 1 and 2, where records are entered in the ledger entry of the organisational unit) and through social programmes (Module 3, automatic ledgering for qualifying groups of users). ZRNO records position — a participant who meets the defined conditions inscribes ZRNO, thereby recording their position in the common good. The total number of ZRNOs available for inscription is fixed. Both units are records in the common-good ledger, not assets owned by the user — the user has no property right over them. The accounting coefficient between them is calculated by the Protocol on the basis of the state of the entire ledger; that coefficient changes with activity in the system and no user can control it individually.

The accounting units are not money, currency, digital assets, or financial instruments. Chapter 6 describes in detail how these records arise, how they are used, how they are accounted for, and why they do not fall under the regulatory frameworks designed for financial instruments.

## Licences

The software and content of the common good are protected by licences that ensure they remain common. The licences cover code and content — not the ledger or infrastructure, whose protection rests on other mechanisms (the legal structure of the Foundation, the rules of the Protocol, and the four system principles set out in Chapter 4).

The system's software is licensed under AGPL-3.0 (GNU Affero General Public License, version 3.0). This licence means that the source code is free to use, modify, and distribute, but any modified version used to provide services over a network must also be published under the same licence. In practice, this means that no one can take the KOLO system software, modify it, and run a closed version without publishing their code. AGPL-3.0 protects the common good from software privatisation.

The system's content is licensed under CC BY-SA 4.0 (Creative Commons Attribution-ShareAlike 4.0 International). This licence permits free use and adaptation of content under two conditions: attribution of the source and licensing of adapted content under the same or a compatible licence. In practice, this means that content created within the system can be used outside it, but cannot be closed — every adaptation must remain open under the same or compatible conditions.

The choice of these two licences is not coincidental. Both belong to the family of copyleft licences — mechanisms that use copyright to legally prevent restrictive relicensing. Copyleft ensures that every derivative remains available under the same or compatible conditions, thereby legally protecting the software and content of the common good from the two greatest risks: software privatisation and content enclosure.

For users in the system, these licences mean that the software and content used within the system remain available to all — no actor, not the founder, not the Foundation, not any user, can relicence them under more restrictive conditions. The common good in the broader sense — including the ledger and the rules — is protected from appropriation by additional mechanisms: the structure of the Foundation, which safeguards the common good but is not its owner and has no right of disposal over it (Chapter 5), the four system principles that cannot be revoked by a governance decision (Chapter 4), and the rules of the Protocol that prevent unilateral modification of the ledger. This is not a declaration of intent, but a set of legal and technical mechanisms built into the foundations of the system. Copyleft licensing as a legal strategy for protecting shared digital goods has its basis in copyright law theory (Lessig, 2004) and the philosophy of free software (Stallman, 2002).

# 4. What KOLO Is — The Legal Position of the System

KOLO is a participatory system of common good. This definition describes the legal nature of the system and determines its place in relation to existing legal categories.

*Participatory* means that the system operates through the activity of its users. Every record in the system's ledger arises as a consequence of a specific user activity — exchange, contribution, organizing, verification. The position of a Kolo keeper in the accounting system changes with the activity of the community as a whole — the accounting coefficient is a consequence of the collective activity of all users, not of the individual position of a single Kolo keeper. A Kolo keeper who holds free ZRNO without their own activity retains an evidenced position, but any change in that position arises solely as an arithmetic consequence of the activity of other users in the system — the system does not create benefit targeted at inactive users, nor does any person promise or guarantee a change of position. A Kolo keeper who wishes to participate in governance must activate ZRNO, which excludes it from the possibility of redemption — the governance function requires an active decision and a structural renunciation of accounting flexibility. Any change in the position of a Kolo keeper manifests exclusively in POEN — records in the ledger that have no external financial value, cannot be converted into money, and cannot leave the system. The system provides no mechanism through which a user could invest resources and wait for a return with external value — any benefit from a change of position is intra-systemic. Monetary donations to the Foundation are non-refundable and without consideration — the recording of a donor's contribution in POEN is a unilateral administrative record of the Protocol, not an equivalent of acquiring a position in the system on the basis of a payment.

*System* means that it is an organised set of rules, mechanisms, and relationships that form a functional whole. KOLO is not a platform in the conventional sense — it does not provide services to users in exchange for a fee. KOLO is not a network in the sense of free connection without structure. KOLO is a system with defined rules of access, recording, accounting, and governance.

*Of common good* means that everything the system produces and preserves is the collective good of all users. No user owns a share of the system. No institution — including the Foundation — owns the system. The common good is the collective good of all users, but not in the sense of collective property over which users would have a right of disposal — whose protection is secured by the licences (AGPL-3.0 and CC BY-SA 4.0) and the legal structure of the Foundation, which safeguards it but is not its owner.

This category — participatory system of common good — does not exist as a formal legal category in Serbian law. KOLO does not seek to be recognised as a new legal category — it uses existing legal instruments precisely because it does not require new law. The Foundation is registered under the Law on Endowments and Foundations. The licences are internationally recognised legal instruments. The relationship between the user and the system is contractual in nature — by joining the system, the user accepts the terms of use. At the same time, the category that KOLO represents is not unknown at the international level — the European Commission, through the Action Plan for the Social Economy (COM(2021) 778 final) and the Council of the EU Recommendation on developing social economy framework conditions (November 2023), has actively defined the space for entities of this type, which is relevant for Serbia in the process of EU accession.

## The Four Principles Underpinning the Legal Position of the System

The legal position of the KOLO system rests on four principles that are embedded in the design of the system, not added subsequently as legal protection.

**Non-convertibility.** No accounting unit of the system can be converted into money, currency, or any means outside the system — neither directly nor indirectly, including exchange for vouchers, gift cards, or any other means with external value — one that can be turned into money, transferred to a third person, or used with a merchant of the holder's choice. The distribution of vouchers from sponsorship in goods and services is not that: the voucher is provided by the giver under an agreement for the benefit of third parties, the giver does not receive POEN, the Foundation owns and pays for nothing in the distribution, and the voucher is issued in the name of the holder and for a specified good with a single giver and cannot be turned into money; the annulment of the record upon taking a voucher is an annulment upon use. POEN cannot be exchanged for dinars nor taken out of the system. ZRNO cannot be sold, transferred, or monetised. This is not a restriction that can be revoked by a decision of the Foundation or the community — it is a structural element whose removal would fundamentally change the legal classification of the system.

**Absence of property rights over records.** Users have no property right over the records of POEN and ZRNO in the system's ledger. A POEN record is not an asset owned by the user — it is a data point in the ledger of the common good. ZRNO is not a share, stock, or any form of property right — it is a record of position in the common good (Section 6.2). The ledger is part of the common good. The user has a recorded contribution and a recorded position — but those records are not their property, cannot be transferred to another person, and cannot be inherited as property rights. The Kolo keeper has a position in the accounting system, but that position is not a property right — it is a consequence of the system's structure and the activity of all users. The question of the treatment of records after the death of a user is identified as an open legal question in Chapter 13.

**Non-refundability of donations.** The monetary funds that the community gives to the Foundation are donations within the meaning of applicable regulations. A donation is non-refundable. The donor does not acquire a right to a refund, does not acquire governance rights in the Foundation on the basis of a donation, and does not acquire a share in the system on the basis of a donation. The Protocol records the fact of the donor's contribution in POEN, but this record is not consideration for the donation — it is a unilateral administrative record of the Protocol that notes the fact of contribution, of the same character as the record of any other form of participation in the system. The donor cannot condition the donation on the recording, nor does the recording create an obligation of the Foundation towards the donor. This separation is a design decision, not a pre-existing fact — the system is constructed so that the two acts are legally independent. The legitimacy of that separation does not depend on whether it arose spontaneously or was designed — every legal framework constructs categories that it then applies (cf. Pistor, 2019). What is relevant is whether the system's structure consistently enforces the separation in practice, not whether the separation is performative in its origin.

**Data minimisation.** The platform collects only data necessary for the operation of the system. The Foundation does not store the personal data of platform users — all user data is stored on the Protocol's infrastructure. The user themselves decides what additional data to enter for ease of use — entering additional data is not a condition for proof of reality nor for access to system functions. This principle is simultaneously a regulatory requirement (Art. 5(1)(c) of the Personal Data Protection Act) and a design decision — a system that does not collect data it does not need to have cannot lose it, misuse it, or be compelled to surrender it.

Among the four principles, non-convertibility plays a fundamental role in the regulatory positioning of the system. The arguments that exclude POEN from the definition of digital asset (Art. 2 of the Digital Assets Act), payment instrument (Payments Act), and electronic money rest on the premise that POEN has no external value — and that claim stands only as long as no conversion mechanism exists. The classification of ZRNO as falling outside the scope of an investment contract rests on the premise that any change in the Kolo keeper's position has no external realisation — which again depends on the non-convertibility of POEN. Non-convertibility is, in that sense, the principle on which the legal consequence of the other three principles depends: they define the character of the system, but non-convertibility ensures that character is legally relevant. The other three principles are not redundant — each independently contributes to the legal position of the system — but without non-convertibility, the classification of the system under the Digital Assets Act, the Payments Act, and the Capital Markets Act would not hold.

## What KOLO Is Not

The positive definition of the system — a participatory system of common good with non-convertible records, without property rights of users over the ledger and with non-refundable donations — clearly distinguishes it from legal categories with which it might be confused.

KOLO is not a digital asset trading platform. The Law on Digital Assets (Art. 2) defines a digital asset as a digital record of value that can be digitally transmitted, stored, or traded, and further distinguishes virtual currencies from digital tokens. Records in the KOLO system meet neither the general nor the specific definitions: POEN exists exclusively as a record in the Protocol's ledger without a holder — when a user initiates a ledger update, the Protocol changes its own database, but nothing changes the holder because POEN has no holder. ZRNO is non-transferable. No record can be stored outside the system, traded, or monetised. There is no secondary market for any record in the system.

KOLO is not a payment system nor a payment service provider within the meaning of the Law on Payment Services. A payment transaction within the meaning of the Payments Act presupposes the transfer of monetary value between a payer and a payee — such a transfer does not exist in the KOLO system because POEN has no monetary value and has no holder. The user exchanges goods and services with another user, and the Protocol records that exchange by updating its own database. The exchange is voluntary, and the recording is a consequence of the exchange, not the means by which the exchange is effected. No user is obliged to accept POEN as fulfilment of anything. POEN is not electronic money either, because it lacks the elements of that definition: a POEN record is not a monetary claim either against the Foundation or against any other person; it is not issued upon receipt of monetary funds, but the contribution is recorded under the rules of the system, and the donation and the recording are legally separate acts; it does not serve to execute payment transactions; in a ledger update the Foundation does not receive, hold or transfer monetary funds and does not charge for the update; there is no payout or redemption from the record; and a person outside the ledger, including the giver of a voucher from sponsorship in goods and services, does not receive POEN.

KOLO is not an investment fund nor a collective investment scheme within the meaning of the Capital Markets Act. Art. 2 of the Capital Markets Act defines transferable securities, collective investment units, and financial instruments. ZRNO does not meet the definition of a transferable security because it is non-transferable — there is no transfer mechanism, no market, and no possibility of trading. ZRNO does not meet the definition of a collective investment unit because it does not represent a participation in a fund whose value depends on the assets in which funds are invested — ZRNO records a position in an accounting system that has no external financial value. POEN does not meet the definition of a financial instrument because it has no holder, cannot be transferred, and cannot be converted into money. No user invests funds in the system with an expectation of financial return. A donation to the Foundation is non-refundable and without consideration (the principle of non-refundability of donations). Any change in the position of a Kolo keeper is not a return — it arises only if there is user activity in the system, is not paid out by any person, and is not guaranteed by anyone. There is no promise of return — neither explicit nor implicit.

KOLO is not a crypto project. There is no token that is issued, traded, or listed on an exchange. There is no ICO, IDO, or any form of public offering. There is no blockchain — KOLO uses a centralised ledger maintained by the Protocol on infrastructure held by the Foundation. Decentralisation in the KOLO system is not technical but governance-based — the progressive transfer of decision-making from the founders to the community.

The Foundation does not issue financial instruments. It is registered under the Law on Endowments and Foundations as a legal entity that pursues public-benefit objectives. Its role in the system is service-oriented — it safeguards the common good but is not its owner; it is not an issuer of securities, an operator of a payment system, or a manager of an investment fund.

## Where KOLO Is Located

KOLO combines legal instruments from several existing categories. It is not a private company maximising profit for owners. It is not a state institution providing a public service. It is not a non-profit organisation in the classical sense — although the Foundation is non-profit, the system as a whole is broader than the Foundation. It is not a cooperative within the meaning of the Law on Cooperatives — although it shares principles with the cooperative movement.

KOLO is a system for which Serbian law has no ready-made category, but for which it has sufficient legal instruments to describe and protect it. The space in which KOLO is situated is not empty at the international level — as elaborated in Chapter 1, the European Union and the United Nations are actively building an institutional framework for the social and solidarity economy into which KOLO functionally fits. The EU Action Plan for the Social Economy (COM(2021) 778 final), the Council of the EU Recommendation (2023), and the UN General Assembly Resolution A/RES/77/281 (2023) recognise foundations, cooperatives, and participatory systems as legitimate forms of economic organisation — categories into which KOLO structurally fits. For Serbia in the process of EU accession, this framework is not abstract — it is the direction of regulatory development that the country is entering.

KOLO does not wait for the formalisation of that category. It uses existing legal instruments that are sufficient: the Foundation gives legal personality, the licences protect the common good, and contracts regulate the relationship with users. The four principles — non-convertibility, absence of property rights, non-refundability of donations, and data minimisation — ensure that the system does not fall under the regulatory frameworks designed for financial instruments, payment services, and digital assets.

## The Legal Nature of the User–Foundation Relationship

By joining the system, the user accepts the terms of use which constitute an access contract within the meaning of Art. 142 of the Law on Obligations — a contract with pre-determined conditions that the user accepts in their entirety. The Foundation is not a service provider within the meaning of the Consumer Protection Act because it does not provide a service for a fee — the user does not pay for use of the system, and a monetary donation is non-refundable and without consideration. The user's relationship with the Foundation is not that of a consumer but participatory — the user is not a client purchasing a service, but someone who voluntarily accepts the rules of a shared system. The terms of use — published before registration and available to all users — regulate the rights and obligations of both parties, including the conditions of access, recording rules, procedures for leaving the system, and the exercise of rights under Chapter 12.

The legal position of the KOLO system is not a defence against regulation. It is a design that from the very outset takes into account where the system sits within the legal order — not retrospectively, but as a structural element of the architecture.

# 5. System Architecture

The architecture of the KOLO system has a centre and two actors around it.

The centre is the common good, with the Protocol as its technical mechanism. Chapter 3 describes what the common good contains — software, rules, ledger, content — and how the Protocol operates. In the context of architecture, the common good is that around which everything else is organised. The common good has no legal personality and makes no decisions — it exists as a set of code, rules, and records on infrastructure held by the Foundation. The infrastructure is not a constituent part of the common good in the same sense as the software, rules, and ledger, but it is the operational prerequisite without which the common good cannot function — its maintenance is a service obligation of the Foundation.

Around the centre stand two actors: the Foundation and the community. Each has a clearly defined function, a clearly defined relationship to the common good, and a clearly defined relationship to the other actor.

## The Foundation

KOLO Foundation is the legal instrument of the system. It is registered in Sombor under the Law on Endowments and Foundations as a legal entity pursuing public-benefit objectives.

The common good has no legal personality — it cannot enter into a contract, hold an account, or engage in legal transactions. The Foundation gives it legal form.

The Foundation's functions are service-oriented. The Foundation holds the infrastructure on which the Protocol operates. It receives monetary donations from the community and sponsors. It pays the operational costs of the system — servers, development, maintenance, legal services. It represents the system in legal transactions — signs contracts, submits applications, communicates with regulatory bodies. In Phase 1, while governance has not yet been transferred to the Upper Kolo, the founder in cooperation with the Foundation sets the rules of the Protocol, in accordance with the restrictions established by the KOLO Rulebook.

The Foundation is not the owner of the system. The Foundation safeguards the common good, but is not its owner. The distinction is legally relevant: an owner has the right to dispose of property according to their own will, to sell it or change its purpose. The Foundation has none of those rights over the common good. The licensing mechanisms described in Chapter 3 — AGPL-3.0 for software and CC BY-SA 4.0 for content — legally prevent the Foundation from privatising any part of the common good. The Foundation may cease to exist, and the software and content remain available under the terms of the licences under which they were published. The ledger, however, depends on infrastructure — the continuity of its custody is an operational matter that the Foundation ensures while it exists, and in the event of the Foundation's cessation is resolved in accordance with the law and the transfer procedures described in Chapter 10.

The Foundation has no share in the accounting system. The Foundation does not acquire POEN, does not inscribe ZRNO, and does not participate in the internal accounting. Its relationship with the system is exclusively through the monetary funds it receives as donations and spends on operational costs. This separation is structural — the Foundation is a legal instrument, not a user in the accounting.

## The Community

The KOLO Community consists of all users in the system, who together take care of the common good.

The community is not a legal entity, has no organs or representatives, and does not make decisions as a whole. The community is the totality of all users who use the system and contribute to it. A user is also a user of a service within the meaning of the regulations, but is not a client purchasing a service from a platform, but someone whose relationship to the common good is not proprietary but participatory — the right to use and contribute, with participation in governance acquired under the conditions described in Chapter 10. Participants form the Kolo; the Kolo is not a legal entity either, and belonging to the Kolo is not membership in the Foundation or in any other legal entity (Chapter 7).

The community contributes to the common good in two ways.

The first way is participation in the system. Every exchange, every activity, every verification — all of this leaves a record in the ledger and thereby augments the common good. The Protocol records these contributions in POEN.

The second way is financing the Foundation. The community gives monetary donations to the Foundation, which spends those funds on the infrastructure and programmes of the system. This financial flow is the foundation of the system's architecture, not a module (the detailed mechanics are described in Chapter 8) — without it the Foundation cannot maintain the infrastructure, and without the infrastructure the Protocol has nowhere to operate.

The community does not make decisions as a whole, but governance of the system progressively passes to the community. In the current phase, governance lies with the founders and the Foundation. As the system grows and the conditions for the formation of the Upper Kolo are activated, governance passes to the Upper Kolo, composed of the Kolo keepers who have activated ZRNO. Chapter 10 describes how that transfer works. Here it is sufficient to say that the architecture of the system is designed so that governance can pass from one holder to another without changing the foundation — the common good and the Protocol remain the same; only who sets the rules changes.

## The Relationship Between the Foundation and the Community

The relationship between the Foundation and the community is not hierarchical. The Foundation does not govern the community. The community does not govern the Foundation — in the current phase there is no mechanism for that, and in the later phase that relationship is indirect, through the Upper Kolo (Chapter 10). Their relationship is functional: the community finances the Foundation with monetary donations, the Foundation maintains the infrastructure; the community uses the system and contributes to the common good, the Foundation represents it in legal transactions; the community grows, the Foundation scales the infrastructure to match growth.

The financial flow between the community and the Foundation is unidirectional and monetary — the community gives the Foundation donations in dinars, the Foundation spends them on operational costs. Monetary funds do not enter the internal accounting system. These flows are strictly separated, as elaborated in Chapters 3 and 4.

The donor's contribution is recorded in POEN as a unilateral administrative record of the Protocol — the legal classification of this relationship is elaborated in Chapters 4 and 6.1.

When monetary donations exceed the Foundation's operational costs, the surplus is directed into system programmes — collective procurement, social programmes, infrastructure investments. The rules for allocating the surplus are defined by the founder and the Foundation in the current phase, and by the Upper Kolo in the later phase. The surplus is never distributed to individual users as a return, dividend, or any form of individual monetary payment.

## How the Parts Fit Together

The common good with the Protocol exists as code and rules. The Foundation gives it legal form and infrastructure; the community gives it content, activity, and financing. The Protocol maintains the ledger, the Foundation represents the system in legal transactions, and the community uses it and — progressively — governs it.

This architecture is intentionally simple. Two actors, the common good at the centre, clear flows. The complexity of the system comes not from the architecture but from the accounting framework and the modules that are added on this foundation. The foundation is stable and does not change with the addition of modules — each module is an extension that operates on the same infrastructure, uses the same Protocol, and respects the same rules.

Chapter 6 describes the accounting framework — how the Protocol inscribes and maintains records of POEN and ZRNO, how the coefficient between them is calculated, and why neither of those records constitutes a financial instrument.

# 6. Accounting Framework

Chapter 3 introduced POEN and ZRNO conceptually — POEN records contribution, ZRNO records position. This chapter describes how that recording works: how records are created, how they are used, how they are calculated, and why they do not fall under the regulatory frameworks designed for financial instruments.

The term "accounting framework" is deliberately chosen instead of "economic model." KOLO does not model an economy in the sense of markets, prices, and resource allocation. KOLO maintains a ledger of contributions and positions through accounting units whose records are inscribed and maintained by the Protocol. Everything that follows in this chapter describes the administrative mechanics of the ledger, not financial flows.

## 6.1 POEN

### Definition

POEN is the internal accounting unit of the system. A POEN record in the Protocol's ledger represents a user's recorded contribution to the common good. POEN is a data point in the ledger — the legal classification of what POEN is not is elaborated in detail at the end of this section, continuing the analysis from Chapter 4.

### How Records Are Created

POEN records are inscribed exclusively by the Protocol. No user can inscribe a POEN record on their own. No institution — including the Foundation — can inscribe a POEN record outside the rules defined in the Protocol. Records are created on the basis of user activity and rules set by people (in the current phase, the founder and the Foundation; in the later phase, the Upper Kolo).

The Protocol updates the POEN ledger in two ways. A user may initiate a ledger update that decreases their record and increases another user's record — whether as part of an exchange of goods and services, or without consideration. In doing so, POEN does not change holder because it has no holder: it exists exclusively as a record in the Protocol's ledger, and the Protocol updates its own database on the basis of the user's instruction. The total number of POEN in the system does not change with such an update (zero-sum). In addition to updating existing records, the Protocol inscribes new POEN records through four separate mechanisms. The first is user contribution — donations to the Foundation, sponsorship by legal entities and entrepreneurs for which the application is submitted by a user, operational contribution, and verification of users. In all these cases, the record is noted in the record of the user who contributed. The second is the growth of Circles and Cooperatives (Modules 1 and 2): the Protocol inscribes new POEN records in accordance with the number of members and the reaching of defined thresholds, but those records are entered in the record of the organisational unit, not of individual members. The third is automatic recording within social programmes (Module 3): the Protocol inscribes new POEN records for qualifying groups of users on the basis of status, without any activity on the part of the support recipient. The fourth is the founding contribution — a retroactive recording of work performed before the platform launched, which the Protocol records progressively and up to a pre-established ceiling (Section 8.1). Each of these categories has pre-defined rules — how many POEN are recorded, under what conditions, with what limitations. These rules are part of the Protocol and can be changed through the governance processes described in Chapter 10.

The Protocol does not inscribe POEN records arbitrarily or at its discretion. Every record is the consequence of a specific user activity and the application of a specific rule. The Protocol cannot inscribe records without activity, nor can it deviate from the rules.

### How the Ledger Is Updated During Exchange

When two users exchange goods or services, the Protocol updates the ledger of both users — it records the contribution of the giver and the receipt of the receiver. The total number of POEN does not change in the process (zero-sum). The key distinction from a payment system: the user does not hold a means that they transfer to another person. POEN has no holder — the user initiates an update of the Protocol's ledger, not a transfer of a means.

### Property Rights

Users have no property right over POEN records — this is the second of the four principles of the system elaborated in Chapter 4. As established in the preceding sections, POEN has no holder, and the ledger update is an operation by the Protocol on its own database, not a transfer of a means between two persons. The user cannot take POEN out of the system, cannot sell it for money, and cannot inherit the records of another user. As the records have no financial value by the design of the system, have no holder, and cannot be converted into a means with external value, within the design of the system there is no legal basis for claiming their value — this follows from the very nature of the ledger, not from a contractual restriction.

For understanding the nature of POEN, the distinction between a ledger and a means is useful. A means (money, token, transferable voucher or gift card) has inherent or assigned value that can be transferred. A ledger (civil register, land register, minutes) records a fact without itself being the value. POEN is closer to the second category — it records that a contribution occurred, but the record itself does not represent transferable value or a promise of future benefit. This distinction corresponds to the difference that the literature on complementary currencies draws between accounting-based systems (mutual credit, accounting-based) and means-based systems (token-based) — with KOLO explicitly in the first category (Greco, 2009; Lietaer, 2001).

### Usage

POEN is used within the system for the exchange of goods and services between users and as a measure of contribution on the basis of which the conditions for the inscription of ZRNO are calculated. POEN cannot be used outside the system — there is no mechanism for conversion into money or into any means with external value (the principle of non-convertibility, Chapter 4).

### Legal Classification

The legal classification of POEN — exclusion from the categories of digital asset, payment instrument, electronic money, and money — is elaborated in Chapter 4. The mechanics described in the preceding sections corroborate that classification from the perspective of how the system operates.

The Law on Digital Assets (Art. 2) defines a digital asset as a digital record of value that can be digitally transmitted, stored, or traded. POEN does not meet the functional preconditions of that definition: it is not transmitted within the meaning of the law because it has no holder — the user does not hold POEN and does not deliver it to another person, but initiates an update of the Protocol's ledger; it cannot be stored outside the system; it cannot be traded because no secondary market exists. POEN is not a "digital record of value" because it cannot be converted into money, cannot be monetised outside the system, and there is no market on which it could be traded.

Law on Payment Services. POEN is not transferred between users within the meaning of the law because it has no holder. When a user initiates a ledger update, the Protocol changes its own database; there is no payment transaction because nothing with monetary value changes holder. POEN is not electronic money either, because it lacks the elements of that definition (Chapter 4): it is not a monetary claim against anyone; it is not issued upon receipt of funds (the Protocol records it on the basis of user activity, not on the basis of a payment; a donation to the Foundation and a contribution record are legally separate acts); it does not serve to execute payment transactions; the update is not charged for; and there is no payout or redemption from the record.

## 6.2 ZRNO

### Definition

ZRNO is a record of position in the common good. A ZRNO record in the Protocol's ledger means that a participant has met the conditions for the recording of a position. ZRNO is a data point in the ledger that records that the user to whom it is inscribed participates in the common good in a way that meets defined conditions — the legal classification of what ZRNO is not is given at the end of this section, continuing the analysis from Chapter 4.

A Kolo keeper has a benefit from that status. That benefit is a consequence of the system's structure — participation in governance through the Upper Kolo and a position in the accounting system that changes with a change in the accounting coefficient. That benefit is not guaranteed, is not fixed, and is not paid by any person.

### Availability

The total number of ZRNO available for inscription is fixed at one million. This number can neither be increased nor decreased. One million is the upper limit — at any given moment, part of the ZRNO is recorded with users and part is available for recording in the Protocol. The sum of these two numbers is always one million.

The fixedness of the total number is a design rule of the system, not a parameter subject to governance change. A fixed number means that the total scope of recorded position in the common good is limited. The more users inscribe ZRNO, the less is available for new inscriptions, which changes the accounting coefficient for all users. This mechanism is described in Section 6.3.

### Inscription

ZRNO is inscribed only by a Kolo member or a member without confirmation, who does not activate the inscribed ZRNO until confirmed; a user, who is not in the Kolo, does not inscribe ZRNO. The inscription is carried out exclusively through the Protocol, on the basis of meeting two conditions.

The first condition is the recording minimum: the user inscribing ZRNO must have at least twenty thousand POEN recorded in the system. This threshold ensures that only participants who have demonstrated an active position in the common good through their contribution can inscribe ZRNO.

The second condition is the limit per accounting period: a user may inscribe at most one percent of their POEN balance per accounting period. This limit prevents a sudden seizure of available ZRNO by individual users and ensures the gradual recording of positions.

The inscription of ZRNO is the user's decision, executed through the Protocol when the conditions are met. The Protocol does not inscribe ZRNO automatically — the user initiates the inscription, the Protocol verifies the conditions, and executes the inscription if they are met.

### States of ZRNO

Inscribed ZRNO has two states: free and active. All states and transitions between them are updated at midnight, together with all other accounting operations of the Protocol.

Free ZRNO is inscribed ZRNO that the Kolo keeper maintains in the ledger without a governance function. The Kolo keeper may initiate two operations with free ZRNO: activation — whereby the ZRNO transitions to the active state and becomes the basis for voting power in the Upper Kolo — or redemption — whereby the ZRNO is returned to the pool of available ZRNO in the Protocol, and the Protocol records POEN to the Kolo keeper at the current accounting coefficient. The Kolo keeper may redeem any number of free ZRNO — redemption may be partial. A member without confirmation to whom ZRNO is inscribed may redeem free ZRNO, but may not activate it.

Active ZRNO is inscribed ZRNO that the Kolo keeper has activated for participation in governance. Active ZRNO confers voting power in the Upper Kolo — voting power equals the square root of the number of active ZRNO (Chapter 10). Active ZRNO cannot be redeemed — a Kolo keeper who wishes to redeem active ZRNO must first withdraw it to the free state, after which they may initiate redemption in the following accounting period.

This mechanism establishes a structural choice between the governance function and accounting flexibility. A Kolo keeper who activates ZRNO gains voting power but loses the ability to redeem while the ZRNO is not withdrawn. A Kolo keeper who keeps ZRNO free may redeem it for POEN, but has no voting power. The choice is exclusive in each accounting period — the same ZRNO cannot simultaneously serve for voting and be available for redemption.

### Redemption

A Kolo keeper may initiate the redemption of free ZRNO — returning it to the pool of available ZRNO in the Protocol. Upon redemption, the Protocol records POEN to the Kolo keeper at the current accounting coefficient. Redemption is the reverse of inscription: at inscription, the user spends POEN and inscribes ZRNO; at redemption, the Kolo keeper returns ZRNO and the Protocol records POEN. Both operations are executed at midnight at the coefficient applicable for that accounting period.

Redemption is exclusively the Kolo keeper's decision — the Protocol does not redeem ZRNO automatically nor does it compel the Kolo keeper to redeem. Redemption may be partial — the Kolo keeper may redeem any number of free ZRNO, from one to all. There is no limit on redemption per accounting period. Active ZRNO cannot be redeemed — the Kolo keeper must first withdraw it to the free state, after which they may initiate redemption at the earliest in the following accounting period. A user to whom ZRNO is inscribed but who is no longer in the Kolo holds the ZRNO but does not redeem it (Chapter 7).

The accounting coefficient at the time of redemption may be higher or lower than the coefficient at the time of inscription. If higher, the Protocol records more POEN to the Kolo keeper upon redemption than they used as the basis for inscription. If lower, it records fewer. This difference is not a return paid or guaranteed by anyone — it is an arithmetic consequence of a change in the state of the ledger of the entire system. No institution guarantees that the coefficient will grow. POEN obtained through redemption have the same status as all other POEN — records in the ledger without external financial value that cannot be converted into money (Chapter 4, principle of non-convertibility). The classification of the difference in recorded POEN as something that is not a return rests on this chain: the difference exists only in POEN → POEN have no external financial value → because no conversion mechanism exists. If non-convertibility were breached, the difference would acquire external value and the classification would change — which is an additional reason why non-convertibility is a structural element of the system, not a parameter subject to change.

### Non-transferability

ZRNO cannot be transferred between users. There is no mechanism — either in the Protocol or outside it — by which a user could transfer their ZRNO record to another user. This is not a technical limitation that could be circumvented — it is a design rule of the system. ZRNO is a non-transferable record tied to the identity of the user established in the chain of confirmations — even if a user were to attempt to assign access to an account, the ZRNO remains tied to the physical person whose reality was established by the verifier, thereby preventing functional transfer. The non-transferability of ZRNO means that there is no market for ZRNO, no price for ZRNO, and no possibility of speculating with ZRNO.

### The Position of the Kolo Keeper in the Accounting System

A Kolo keeper has a position in the accounting system that changes with community activity through the accounting coefficient (Section 6.3). No institution pays or guarantees that benefit — the change in position is an arithmetic consequence of the activity of the entire system, not a guaranteed result of an individual position. If there is no user activity in the system, there is no change in the coefficient.

### Legal Classification

The legal classification of ZRNO — exclusion from the categories of securities, digital assets, and investment instruments — is elaborated in Chapter 4. The mechanics described in the preceding sections — non-transferability, absence of a market, absence of a dividend or guaranteed return — corroborate that classification.

Supplementary analysis confirms exclusion from the category of investment instrument. The user does not invest money in a joint undertaking — ZRNO is acquired by recording contribution in POEN, not by payment of funds, and the threshold of 20,000 POEN can be reached exclusively through exchange, operational programmes, or verification, without a single dinar of donation. There is no expectation of profit in the financial sense — a position in the accounting system is not a return. Any change in position does not depend on the efforts of third parties, but on the activity of the entire community in the system, which is a fundamentally different relationship from the investor–manager relationship. Two specific aspects of the ZRNO mechanics require supplementation of this analysis.

The donation–POEN–ZRNO chain. A user who donates dinars to the Foundation acquires a record in POEN that may bring them closer to the threshold for inscribing ZRNO. Three elements break the classification of this chain as an investment contract: the donation is non-refundable and legally separate from the record — the donor cannot condition the donation on the record nor demand a refund; the donation is neither a necessary nor a privileged path to ZRNO — the same threshold applies to all activities and a participant can reach the threshold exclusively through exchange and contribution, without a single dinar of donation; the relationship between the amount of a donation and the number of recorded POEN is not a fixed conversion rate but a parameter that can be changed. Even if the relationship were fixed, the donation is legally non-refundable and creates no obligation of the Foundation towards the donor, which severs the element of expectation that would ground classification as an investment contract.

The redemption mechanics. A Kolo keeper who inscribes ZRNO at one accounting coefficient and redeems it at another receives a different number of POEN than the one used as the basis for inscription — in both directions, because the coefficient rises with the inscription of new POEN records and falls with their annulment (Section 6.3). Four elements break the classification of that difference as a return: POEN recorded through redemption have no external financial value — they cannot be converted into money, taken out of the system, or monetised (the principle of non-convertibility); a change of the coefficient is not guaranteed — it arises from the state of the ledger of the entire community, not from the efforts of third parties within the meaning of an investment contract; one's own inscription and redemption do not shift the coefficient at all, so the Kolo keeper has neither an instrument nor a moment by which to realise the difference; there is no issuer who promises the growth of the coefficient nor any institution that pays the difference. Additionally, the system's structure establishes a structural choice that limits purely passive holding: a Kolo keeper who wants the governance benefit must activate ZRNO, thereby losing the ability to redeem; a Kolo keeper who wants accounting flexibility cannot simultaneously vote.

## 6.3 Accounting Coefficient

### Definition

The accounting coefficient is the numerical ratio between the total number of POEN recorded in the system and the number of ZRNO available for inscription in the Protocol. The Protocol calculates it once daily, at midnight.

### Formula

Accounting coefficient = total number of POEN recorded in the system ÷ number of ZRNO available in the Protocol.

Both elements of the formula are variable. The total number of POEN recorded in the system grows with the inscription of new records through all four mechanisms — user contribution (donations, sponsorship, operational contribution, verification), growth of Circles and Cooperatives, social programmes, and founding contribution. The exchange of goods and services between users does not increase the total number of POEN in the system — it redistributes existing POEN among users (zero-sum). The number of ZRNO available in the Protocol decreases when users inscribe ZRNO — because inscribed ZRNO is recorded with the Kolo keeper and is no longer available in the Protocol.

### How the Coefficient Changes

The coefficient is shifted exclusively by changes in the total number of recorded POEN — upward and downward.

Whenever the Protocol inscribes new POEN records — through user contribution (donations, sponsorship, operational contribution, verification), growth of Circles and Cooperatives, social programmes, or founding contribution — the numerator of the formula grows, regardless of in whose record the new POEN are entered. This changes the accounting coefficient upward.

When recorded POEN are annulled — upon termination of user status, upon annulment by utilisation in a collective procurement, upon write-off for a terminated friendship in the children's space, or on another ground laid down by a bylaw — the numerator decreases. This changes the accounting coefficient downward. The coefficient is therefore not monotonic and is not predetermined to rise.

The exchange of goods and services does not affect the coefficient because it redistributes existing POEN without changing the total number.

The inscription and write-off of ZRNO likewise do not shift the coefficient, and this follows from the formula itself rather than from a rule that could be amended. Upon inscription the denominator decreases by the ZRNO inscribed, but the numerator simultaneously decreases by the POEN returned to the Protocol by that inscription and withdrawn from circulation — and that number is precisely the product of the ZRNO inscribed and the prevailing coefficient, so the quotient remains the same. Upon write-off both terms grow in the same ratio. A Kolo keeper cannot, by their own conduct, shift their own coefficient in either direction.

All these effects are consequences of user activity in the system. No individual user controls the coefficient. No institution controls the coefficient. The coefficient is a calculated value arising from the total state of the ledger of all users in the system.

### What the Accounting Coefficient Means for Users

For a participant, the accounting coefficient determines how many POEN are needed to inscribe one ZRNO at a given moment. A higher coefficient means that more recorded contribution is required to inscribe ZRNO. A user who fulfilled the conditions for inscribing ZRNO earlier did so at a lower accounting coefficient — meaning that fewer POEN were needed for the same number of ZRNO.

For a Kolo keeper, a change in the accounting coefficient shifts how their recorded position stands within the system. That change is not a payment, is not a return, and is not guaranteed — it is an arithmetic consequence of a change in the state of the ledger of the entire system. Any benefit from a change of position is realised exclusively in POEN — records in the ledger without external financial value. The Kolo keeper cannot realise the change in position in money, currency, or any external means. The benefit of the position is intra-systemic — it exists only within the system and has value only for users in the system who exchange goods and services within it.

### What the Accounting Coefficient Is Not

The accounting coefficient is an administrative figure — it is not a price (there is no market), not an exchange rate (there is no conversion between two currencies), and not a performance index (it does not measure profitability). The Protocol calculates it on the basis of the state of the ledger and uses it as a parameter for applying the rules of inscription and redemption of ZRNO. Its rise or fall is a consequence of activity in the system, not a decision of any person.

A user who contributes to the system in the early phase — when the coefficient is low — inscribes ZRNO with fewer recorded POEN than a user who does the same in a later phase with a higher coefficient. The position of an early user thereby reflects their contribution in the phase when contribution was most valuable for the establishment of the system. That is a consequence of recognising an earlier contribution to the common good, not an incentive to acquire a position: the number of POEN required for inscription is calculated by the Protocol from the state of the ledger, not by a decision that would reward early participation, and no person promises that this number will later be higher.

The rule of one percent of balance per accounting period (Section 6.2) limits the rate at which available ZRNO is taken up — even when a large number of users simultaneously meets the conditions for inscription, the total volume of inscription per period is limited to one percent of the total balance of all users who meet the conditions for inscription. This preserves access for later users and keeps the coefficient less sensitive to individual inscriptions of new POEN records, because the number of available ZRNO is not exhausted abruptly.

# 7. Users and Proof of Reality
The KOLO system distinguishes four statuses of adult users: user, member without confirmation, Kolo member, and Kolo keeper. A user is any person with an account on the platform, regardless of status. The statuses differ in the scope of access, ledger recording, and the rights that arise from that ledger record. Transition between statuses takes place according to pre-defined rules: through verification and confirmation in the chain of confirmations, and through the inscription and redemption of ZRNO, which the Protocol executes when the conditions are met, without the discretion of any person. A minor user has none of these statuses; their position is described in Chapter 9 (Module 4).

Participants — members without confirmation, Kolo members, and Kolo keepers — form the Kolo. The Kolo is not a legal entity, and belonging to the Kolo is not membership in the Foundation or in any other legal entity.

## Proof of Reality

The reality and continuity of users are confirmed through a verification model based on personal acquaintance or on a conversation after a call — a chain of confirmations in which Kolo members confirm the reality of users or introduce them into the Kolo. The model does not require the collection of personal identity documents. A user is either in the Kolo or not; verification determines access to system functions, and confirmation determines the right to confirm.

Reality is confirmed only in the chain of confirmations. Whoever does not know any Kolo member may get onto the call list: when they themselves request a conversation, when the Foundation establishes the receipt of their public donation of at least 5,000 dinars made in a single payment or of a sponsorship in money for which they submitted the application, or when, as the holder, they register a farm, entered or not entered in the Register of Agricultural Holdings. A member without confirmation who requests a conversation for confirmation also comes onto the same list; such a request is seen only by Kolo keepers. A payment, a sponsorship, and the registration of a farm do not in themselves confirm reality. A Kolo member calls a user from the call list in order to get to know them and, if after the conversation they judge that they know them well enough to answer for the verification, introduces them into the Kolo; the conversation in itself is not verification. The user is informed in advance that the Kolo member who calls them will see their first name and surname and their telephone number. Those data are opened by a click, only to the Kolo member who opened the call and only while the call is open, and the Foundation records who opened them. The donation, the sponsorship, and the contribution recorded on their basis do not depend on the call.

Proof of reality is a prerequisite for full access to the system. Without the verification of users, the system cannot ensure the integrity of the ledger, because it cannot guarantee that a real, unique person stands behind each record. An adult user registers on the platform as a user and immediately participates in exchange — posts listings, converses with other users and participates in POEN ledger updates — but ZRNO inscription and support programmes require verification, and participation in governance and confirming others also require confirmation.

### Chain of Confirmations

Proof of reality functions as a chain of confirmations in which Kolo members confirm users whom they know personally or, after a conversation, introduce them into the Kolo, while members without confirmation introduce into the Kolo users whom they know personally. The model confirms two things: reality (the user exists as a natural person) and continuity (the same person who was originally verified continues to use the account). Uniqueness — that the same person has no other account — cannot be known by the verifier, because they know the person, not their accounts: they therefore do not guarantee it, but declare that they are not aware of another account. For users who come onto the call list, the first and last name, place and telephone number are compared with the data kept alongside other accounts; a match blocks nothing, and that two accounts are accounts of the same person is established by the Foundation, with a statement of reasons and the right to a complaint.

A user's reality is established by one verifier, through one verification. Belonging to the Kolo has no degrees: a user is either in the Kolo or not. A participant is a member without confirmation, a Kolo member, or a Kolo keeper. Only a Kolo member is confirmed: they have full access to all platform functions, including the right to confirm the reality of others. An adult user who has been introduced into the Kolo but has not been confirmed is a member without confirmation.

### Confirmation and Introduction into the Kolo

Verification is either confirmation or introduction into the Kolo. Confirmation is given by a Kolo member, or a founder, to a person they know personally; the confirmed person becomes a Kolo member. A Kolo member introduces into the Kolo after a telephone conversation with a user from the call list, and a member without confirmation introduces an acquaintance whom they know personally; the introduced person becomes a member without confirmation. Whoever is introduced by a member without confirmation is also a member without confirmation. Introduction into the Kolo is not a weaker verification: POEN based on it are recorded under the same rules, and the daily pace, supervision, and liability for false verification apply in the same way as for confirmation.

A member without confirmation has the rights of a participant — they exchange, acquire a POEN record, participate in support programmes, procurements, operational contribution, and cooperatives, inscribe ZRNO, and may redeem free ZRNO — but not the rights that the acts attach to a Kolo member: they do not see the call list and do not introduce users from it into the Kolo, they do not confirm anyone — neither the existence of a child, nor other members without confirmation, nor the fulfilment of the conditions for a support programme — they do not give a member recommendation and do not supervise. They inscribe ZRNO but do not activate it: they have no vote, are not in the Upper Kolo, and do not delegate. They register a farm as holder, without members, and their child does not become a Kolo child. A member without confirmation is confirmed by a Kolo member, or a founder, who knows them personally; after at least thirty days in the Kolo, without an upheld exchange report or listing report and without an established false verification, they may also request a telephone conversation with a Kolo keeper, who confirms them after the conversation; the Foundation may also confirm them on its own decision. A member without confirmation who has inscribed ZRNO comes first on the list, and the Foundation ensures that a Kolo keeper calls them within three days. An exchange may be the way in which they met, but it is not a condition for confirmation. That confirmation is not a new verification and no POEN are inscribed on its basis; it is subject to supervision in the same way as verification, and whoever gives it answers for it as for a verification. When a member without confirmation is confirmed, they receive a list of linked users: those whom they introduced while without confirmation and the one who introduced them, if these are still without confirmation. From the list they personally confirm those whom they know; that is their confirmation, for which they answer as for a verification, it goes into supervision and brings no POEN. Each person so confirmed receives their own list, so confirmation spreads step by step, down the chain and up it, but only by the decision of people who know each other. Confirmation never happens automatically.

### Chain Without a Loop

Since each participant who is not a founder has one verifier, the chain of confirmations is a tree: each such user has exactly one predecessor, and the founders are its roots. A verifier may not confirm anyone from their own ascending line, so no closed loop can arise in the chain. The defence against coordinated manipulation (Douceur, 2002) does not rest on the number of confirmations, but on the verifier's accountability for every verification; on the daily pace of confirming; on supervision by Kolo keepers; and on the fact that the POEN record for a verification arises only once the participant makes a first contribution confirmed by the Foundation or a Kolo keeper.

### Bootstrap and Network Expansion Supervision

Every verification network faces a bootstrap problem — who verifies the first users. KOLO uses a bootstrap mechanism in which the founders — persons from the Foundation's founding core, entered in the public register as founder or as members of the Foundation's organs, and persons designated by decision of the Board of Directors with a publicly disclosed identity — are confirmed without verification by other users, thereby establishing the starting point of the verification tree. The founders are the only ones whose confirmed status does not arise from the chain of confirmations.

Network expansion supervision is performed by Kolo keepers; in the initial phase these are the founders. The supervisory function arises from the status of Kolo keeper, without appointment, and does not depend on the phase of the system. The expansion supervisor subsequently checks the legitimacy of a completed verification, thereby ensuring the integrity of the verification graph. Verifications by founders and Kolo keepers are not subject to supervision, except introduction into the Kolo after a telephone conversation with a user from the call list, which is always subject to supervision, even when performed by a Kolo keeper; only a founder is exempt. Verifications performed by a member without confirmation are shown to supervisors first in the supervision queue. From data already kept, the Foundation also recognises closed groups — members without confirmation who have introduced one another into the Kolo and exchange only among themselves; the check only shows the group to the Foundation and has no effect on the user. The number of verifications a single verifier may perform is not limited; what is limited is the pace — rapidly confirming a larger number of persons in one day first triggers a warning, and then a stop on confirming until the end of the day. A confirmation once given does not lapse because the person who gave it has left the system; only established falsity annuls it.

The Protocol records each act of verification as a contribution to the common good; supervision is not recorded as a contribution. The specific parameters — rules on the daily pace of confirming, bootstrap mechanism rules, expansion supervision procedures, and a detailed analysis of resistance to coordinated manipulation — are defined in the Rulebook on Proof of Reality.

### Data Retained

The platform retains a minimal set of data: the account pseudonym, the verification graph with the information whether each verification is a confirmation or an introduction into the Kolo, the verification and confirmation status datum, the date of joining, and the email address. First name and surname are kept only in a separate identity register (Chapter 12), and the telephone number is left by the user themselves when they consent to a call from the call list. The Foundation does not retain personal data about platform users. A user may voluntarily enter additional data to facilitate use of the platform, but this is not a condition for verification or for access to system functions.

### Legal Dimension of Proof of Reality

The verification graph, even when pseudonymous, constitutes the processing of personal data under the broader interpretation of the Law on Personal Data Protection. The legal basis for this processing is the performance of a contractual relationship — by accessing the system, the user accepts rules that include supervision of the verification process to preserve the system's integrity. Details of compliance with data protection regulations are described in Chapter 12. The precise mechanics of the chain without a loop, the bootstrap mechanism parameters, expansion supervision procedures, and a detailed analysis of resistance to coordinated manipulation are defined in the Rulebook on Proof of Reality.

### Monetary Flow — Separate Identification

Separate identification mechanisms apply to the monetary flow: donor verification is provided through the banking system — the Foundation receives donations from verified bank accounts; sponsor verification (legal entities, entrepreneurs and holders of registered agricultural holdings) is provided on the basis of a donation agreement with the Foundation. These mechanisms relate to identification for the purposes of the Foundation's financial flow, not to proof of reality of users, which is achieved only in the chain of confirmations.

## User Who Is Not in the Kolo

The status of user is held by an adult user registered on the platform who is not yet in the Kolo. They may browse the system, post listings offering or seeking goods and services, converse with other users to the extent established by the Terms of Use, and participate in POEN ledger updates as receiver and as giver. A contribution is recorded for them through contribution to platform content, financial contribution and sponsorship. They have no access to governance, confirming others, or support programmes, and they do not inscribe ZRNO. If they know no Kolo member, they may get onto the call list, from which a Kolo member calls them in order to get acquainted.

A user becomes a Kolo member when a Kolo member confirms their reality and continuity through the chain of confirmations, whereby they acquire full access to the system. When a Kolo member, after a conversation, or a member without confirmation who knows them personally introduces them into the Kolo, they become a member without confirmation.

## Member Without Confirmation

A member without confirmation is an adult user whom someone has introduced into the Kolo but who has not yet been confirmed by a Kolo member who knows them personally. This is a transitional status: they have the rights of a participant, but not the rights that the acts attach to a Kolo member — they do not confirm others but only introduce them into the Kolo, and they do not activate ZRNO (section "Confirmation and Introduction into the Kolo"). Belonging to the Kolo, as in the other statuses, is not membership in the Foundation or in any other legal entity.

## Kolo Member

A Kolo member is a user whose reality has been confirmed by a confirmation in the chain of confirmations. A Kolo member exchanges goods and services with other users within the system. They contribute to the common good through activities whose contribution is recorded in POENs. They may donate funds in dinars to the Foundation, confirm the reality of users whom they know personally, after a conversation introduce users from the call list into the Kolo, and participate in Circles and Cooperatives when those modules are activated (Chapter 9).

A Kolo member does not have ZRNO recorded in the Protocol. This means that they have either not yet fulfilled the conditions for ZRNO inscription (Section 6.2), or have chosen not to inscribe it. A Kolo member fully uses the accounting framework — exchanges, contributes, acquires POEN ledger records — but does not have a recorded position in the sense of ZRNO and does not participate in governance through the Upper Kolo (Chapter 10).

The basic motivation of a Kolo member is immediate: the system enables them to exchange goods and services with other users under rules defined in the Protocol. A Kolo member benefits from participation every time they exchange something with another user. That benefit is not promised and not guaranteed — it depends on whether there are other users in the system who offer what they seek and seek what they offer. A more detailed analysis of the incentive structure is given in Chapter 11.

## Kolo Keeper

A Kolo keeper is a Kolo member who has ZRNO inscribed in the Protocol. A Kolo keeper is everything a Kolo member is — exchanges, contributes, uses the system — but also has additional rights and an additional position in the system.

The status of Kolo keeper does not exempt from proof of reality: the access of a Kolo keeper, like that of every Kolo member, derives from confirmed reality. A Kolo keeper whose verification lapses becomes a user. Their ZRNO remains inscribed and frozen: until they are confirmed again, a user to whom ZRNO is inscribed does not activate it, does not redeem it, does not delegate a vote on its basis, is not part of the Upper Kolo, and does not confirm the reality of others. When their reality is confirmed again, they are once more a Kolo keeper. A Kolo keeper whose confirmation alone is annulled, while their introduction into the Kolo remains valid, becomes a member without confirmation: their ZRNO remains inscribed, active ZRNO passes into the free state, and they may activate it again once confirmed. The only exception are the founders, whose confirmed status does not arise from the chain of confirmations. Kolo keepers perform the function of expansion supervisor for the verifications of other Kolo members and of members without confirmation, as well as for the confirmations of members without confirmation. The number of verifications is not limited for anyone; only the daily pace is limited, and it is the same for all verifiers.

A Kolo keeper, once the Upper Kolo is established, participates in system governance by activating ZRNO. The Upper Kolo is the system's governing body, composed of the Kolo keepers who have activated ZRNO, which decides on Protocol rules. A seat and a vote in the Upper Kolo arise exclusively from activated ZRNO, not from any other basis; free ZRNO does not confer a seat in the Upper Kolo. Chapter 10 describes how the Upper Kolo functions.

A Kolo keeper has a position in the accounting system whose value changes with community activity — the benefit, limitations, and legal characterization of that position are described in Sections 6.2 and 6.3.

The motivation of a Kolo keeper has two aspects. The immediate motivation is the same as for a Kolo member — exchange and contribution. The additional motivation is participation in governance through the Upper Kolo and a position in the accounting system. A more detailed analysis of the incentive structure for all user statuses is given in Chapter 11.

## How One Becomes a Kolo Keeper

A Kolo member becomes a Kolo keeper by inscribing ZRNO through the Protocol; a user does not inscribe ZRNO. A member without confirmation inscribes ZRNO but does not become a Kolo keeper by the inscription: they become one only once confirmed. The conditions for inscription are described in Section 6.2: a minimum of twenty thousand POENs recorded in the system and a limit of one percent of the balance per accounting period.

The transition from one status to another is not an administrative decision — no actor in the system (Foundation, founder, Upper Kolo) approves or rejects an inscription. The user initiates the inscription, the Protocol checks the conditions and executes it if they are met. Inscription is an operation between the user and the Protocol, without the discretion of any individual.

A Kolo keeper may lose that status by redeeming ZRNO at the accounting coefficient in a new accounting period. Redemption is part of the system mechanics described in Section 6.2. A Kolo keeper whose ZRNO has been fully redeemed once again becomes a Kolo member — with all the rights of a Kolo member, without the rights that arise from recorded ZRNO. A Kolo keeper whose verification lapses becomes a user to whom ZRNO is inscribed, with the consequences described in the previous section.

## Users' Relationship to the Common Good

All users have access to the common good — the same software, the same rules, the same infrastructure — to the extent corresponding to their status. A user has access for browsing and participation in exchange; a member without confirmation has the access of a participant, without the rights that the acts attach to a Kolo member; a Kolo member has full access for use and contribution; a Kolo keeper has full access plus governance rights and a position in the accounting system. The difference between statuses is not in the nature of the relationship to the common good but in the scope of the ledger record: a Kolo keeper has a recorded position that gives them governance rights (under the conditions of Chapter 10) and a position in the accounting system.

The relationship of all users to the common good is participatory — the right to use and contribute, not the right to dispose of or own (Chapters 3 and 4).

The conditions of access to the common good are equal for all users of the same status, transparent, and embedded in the Protocol. The rules of access and contribution are defined in the system rules of use and may be changed through the governance processes described in Chapter 10. Clearly defined access boundaries and differentiation of user statuses are structural elements that correspond to the first of Elinor Ostrom's eight design principles for governing common-pool resources (1990) — a detailed mapping is given in Appendix E.

## What Users Are Not

Users in the KOLO system are not clients of the platform. They do not purchase a service from the Foundation. They do not pay a subscription. The Foundation does not owe them a service. The relationship between users and the system is participatory — the user is a user of a service within the meaning of the regulations, but participates in the common good with rights of use and contribution, not with a right to claim a service.

Users are not investors — the reasons are set out in Chapter 4 (the principle of non-refundability of donations) and Section 6.2 (ZRNO inscription based on recorded contribution, not payment).

Users are not employees of the system. Participation in the system is voluntary and does not fulfil any of the three constitutive elements of an employment relationship under Art. 5 of the Labour Law: there is no subordination — the user is not under the supervision or instructions of the Foundation or any other actor; there is no personal obligation to work — the user decides independently whether, when, and how much to participate; there is no remuneration — the POENs recorded after verified execution are entries in the Protocol ledger without external monetary value and cannot be converted into money (Chapters 4 and 6.1). The specific labour-law aspect of operational programmes, where a user undertakes and executes defined tasks, is discussed in Section 8.3.

Users are persons who use the system, contribute to it according to their own decision, and whose position in the system changes with their activity and the activity of the community — within the frameworks and limitations described in Chapter 6.

# 8. Contribution to the Common Good

The common good does not arise on its own — it arises through the contributions of users. In addition to the exchange of goods and services between users (which redistributes existing POENs, Section 6.1), the system recognises three categories of contribution that increase the total number of POENs in the system: financial contribution, operational contribution, and founding contribution. All three are part of the system's foundation — mechanisms that function from day one and underpin the operational and accounting logic of the system. They are not modules that are activated according to prerequisites, but constitutive elements of the system: without financial contribution the Foundation has no funds for infrastructure, without operational contribution the community has no mechanism for recording activities outside the platform, and the founding contribution records work done before the system existed. Unlike financial and operational contribution, which last as long as the system, the founding contribution is one-time and time-limited.

## 8.1 Founding Contribution

The founding contribution is work done before the platform opened — system design, Protocol development, legal and organisational preparation. By its nature it is a contribution to the common good of the same character as operational contribution, but performed before the system existed, so it could not be recorded at the time it took place. Through this channel, the Protocol records that early contribution retrospectively — gradually and up to a pre-determined upper limit. Unlike financial and operational contribution, which last as long as the system, the founding contribution is one-time: when the Protocol has recorded the full amount, the channel closes permanently.

The Protocol does not record the founding contribution all at once, but ties it to system growth — recording it in fixed-amount steps, according to the cumulative growth of the total number of POENs in the system. This is a design decision. Each inscription of new POEN records shifts the accounting coefficient (Section 6.3); recording the full amount at once would produce a sudden jump in the coefficient, while tying it to system growth means the coefficient reaches the same level in proportion to that growth. The channel follows growth whatever its pace may be: if the total number of POENs grows abruptly, the steps are recorded at the same speed at which the growth occurred.

Since the step is fixed, the impact of a single step on the coefficient decreases as the system grows. The share of the aggregate recorded founding contribution in the total number of POENs is a different quantity, and it does not decrease: both the thresholds and the step are expressed in fixed amounts, and POENs recorded through this channel enter the total number, so the aggregate founding contribution constitutes between approximately one fifth and approximately one quarter of the total number of recorded POENs throughout the entire life of the channel — at closing, approximately 24%. That share carries no property right and constitutes no claim; the circle of founders is closed and cannot be expanded, and upon reaching the upper limit the channel closes permanently.

The upper limit is a measure of the contribution that preceded the system: the founders invested their own monetary resources and their own time in the design, construction, and legal and organisational preparation, in a period in which no recording channel was in operation. That work cannot be recorded through operational contribution even retrospectively — the daily limit of that channel amounts to 10% of the total number of recorded POENs, so while that number is zero, the limit is zero as well.

The result of founding work — the software, the Protocol, and the documentation of the system — enters the common good under the licences set out in Chapter 3: software under AGPL-3.0, content under CC BY-SA 4.0. Founders acquire no exclusive right to that result on the basis of that work; it is available to all persons on the same terms, and the licences cannot be replaced with more restrictive ones.

POENs recorded through this channel are entered in the records of the founders — natural persons who performed the work before the platform opened — and have the same status as all other POENs: ledger entries without any proprietary right of the user, non-convertible and without external value (Chapters 4 and 6.1). The founding contribution does not establish an exception to the accounting framework rules — a founder who inscribes ZRNO is subject to the same threshold and the same limit per accounting period as any other user inscribing ZRNO (Section 6.2) — and it is a separate recording mechanism that does not touch the operational contribution limit.

The upper limit of the founding contribution, the amount and schedule of recording steps, and the point at which the channel closes are defined in the Rulebook.

## 8.2 Financial Contribution

Financial contribution is the inflow of funds in dinars to the Foundation that ensures the operational sustainability of the system. This section covers two sub-modules: donations by natural persons and sponsorship by legal entities, entrepreneurs and holders of registered agricultural holdings. Both use the same principle — a non-refundable donation to the Foundation whose contribution is recorded in POENs as a unilateral administrative entry of the Protocol. The difference lies in the legal nature of the donor and the regulatory obligations that arise from it.

### Donations by Natural Persons

Chapter 5 describes the financial relationship between the community and the Foundation as part of the system's basic architecture — the community finances the Foundation through donations in dinars, the Foundation spends on infrastructure and programmes. This section covers the rules, mechanisms, and details of that relationship.

Donations are in dinars or another currency and do not enter the internal accounting system (Chapter 4, principle of non-convertibility). The donor's contribution is recorded in POENs according to rules that define the relationship between the donation amount and the number of recorded entries — the legal characterisation of that relationship is set out in Chapter 4. This section covers the operational mechanics: donation levels, the donation recording coefficient, tax treatment, and surplus allocation rules.

When donations in dinars exceed the Foundation's operational costs, the surplus is directed to system programmes. Collective procurement is a separate sub-module — the Foundation uses surplus funds to procure goods or services that are distributed to participants within the Foundation's programme activities. The rules for surplus allocation are defined by the founder and the Foundation in the current phase, and by the Upper Kolo in a later phase.

Legal dimension: donations are subject to tax regulations governing donations to foundations. The Foundation issues a donation certificate in accordance with the law. The tax treatment of a donation — including any potential tax deductions for the donor — depends on the donor's status (natural or legal person), the Foundation's registered status, and the applicable tax regulations at the time of the donation.

### Sponsorship by Legal Entities, Entrepreneurs and Agricultural Holdings

Sponsors are legal entities, entrepreneurs and holders of registered agricultural holdings who donate money to the Foundation or undertake to give goods and services free of charge to persons designated by the Foundation. This sub-module is a bridge between the external economy and the KOLO system.

The mechanics are as follows: a legal entity, an entrepreneur or a holder of a registered agricultural holding pays a donation into the Foundation's account, and the Foundation uses the funds for the purposes of the system. The contribution is recorded in POEN as a unilateral administrative entry of the protocol, in the record of the user who submitted the sponsorship application — the owner, the legal representative or a person authorised by the competent body of the legal entity, or the entrepreneur or holder of the holding themselves — under the same table that applies to donations by natural persons. The legal form of the giver does not affect the recording coefficient.

The record is tied to a natural person, not to the legal entity itself. A legal entity cannot be a user in the KOLO system — the system is designed for natural persons. The person submitting the application must be an adult user in the system; for sponsorship in money verification is not a condition, while an application for sponsorship in goods and services is submitted by a participant.

The contribution from a single application is recorded in the record of a single user and is not distributed among other owners, including where the legal entity has several owners. Each donation is calculated at the moment of receipt on the basis of a separate donation agreement. The sponsor's cumulative contribution is kept separately from users' personal donations, and the two sums are not added together; a holding has its own sum, separate both from the personal donations of its holder and from the sum of a company with which the holder is connected. The Foundation keeps a record of the link between the legal entity and the user in whose record the contribution is recorded.

This is the only point in the system where the external economy directly influences the internal ledger: the legal entity gives money, goods or services, and the protocol records the contribution in the record of the natural person who submitted the application. The recording is not a payment from the legal entity to the user, nor a distribution of profit, and creates no property right.

Legal dimension: a sponsor is a legal entity or entrepreneur registered in the Republic of Serbia, or the holder of a registered agricultural holding, who pays the donation from the account of the holding or from their own account. The Foundation verifies the sponsor on the basis of the donation agreement and the payer data from the bank statement, documents the link between the legal entity and the user in whose record the contribution is recorded, and takes into account the potential risk of abuse of this link. On account of the contribution, the sponsor acquires no advantage in the selection of an offer in a collective procurement.

Before the first donation, a company or holding is entered once in the sponsor register — with contact details, a logo and the user's relationship to it — and the Foundation checks the entry; every donation, in money or in goods and services, is then initiated from the entry. Sponsorship in goods and services has a different mechanism. Under an agreement, the giver undertakes to hand over precisely specified goods, or to provide services, to participants who take the vouchers; the Foundation does not take over or possess the goods, and the voucher holder has their own right against the giver. The application is submitted by a representative, an entrepreneur, an owner or a beneficial owner, and for a registered agricultural holding by its holder. The value of the contribution is the price from the giver's price list, a photograph of which the giver attaches — the Foundation does not appraise the price. The agreement is concluded electronically, on the platform, by confirmation with a one-time code. The contribution is recorded when the agreement is signed and the vouchers issued, with the coefficient corresponding to the tier the sponsor has reached through monetary contributions; goods and services do not raise the tier, and are kept in a separate part of the sponsor ranking list. A voucher is issued for a good or a service, not for an amount, and is valid for one year. Vouchers are available to participants from issuance, without an order or a deadline: a user takes a voucher and, in doing so, has annulled the number of POEN derived from the recording under the agreement, without the increase by the coefficient — so a donated item does not increase the total number of POEN beyond the increase by the coefficient. The record of this, with the description and the name of the giver, is visible in the ledger alongside the pseudonym, to which the user consents when taking the voucher; a voucher that the user does not redeem before expiry lapses, and the annulment remains. The giver and persons connected with it do not take its own vouchers. If the giver does not perform the obligation, the agreement is terminated: for the holders of unredeemed vouchers the annulment is corrected, and the applicant has written off what was recorded to them for all unperformed vouchers, including the increase by the coefficient, and the write-off is executed even where the record thereby becomes negative; the giver may not conclude a new agreement until the Foundation removes it from the ban list.

## 8.3 Operational Contribution

Operational contribution is an activity outside the platform whose contribution is recorded in POENs after verification. The Foundation, the Upper Kolo, or Kolo keepers publish a task that needs to be performed for the common good. A user voluntarily applies for the execution of the task, and Kolo keepers verify its execution before the contribution is recorded. In Phase 1, while the Upper Kolo has not been established, this function is performed by members of the Foundation's Board of Directors. All applications are publicly visible to all system users, thereby ensuring transparency. Operational contribution may cover a wide spectrum of activities — from organising a local event, through technical work on infrastructure, to promoting the system in the community.

The system applies a limit of 10% of the total number of POENs recorded in the system per accounting period to the quantity of POENs that may be recorded through operational contribution, thereby protecting the ledger from inflationary pressure. This parameter is subject to change through the governance processes described in Chapter 10. The procedure of application, execution, and verification is defined in the Rulebook.

Legal dimension: operational contribution does not establish an employment relationship within the meaning of Art. 5 of the Labour Law. There is no subordination — the user independently decides whether to apply, proposes the execution plan themselves, and determines the manner of work themselves; they may withdraw from the task without consequences other than the absence of contribution recording. There is no personal obligation to work — undertaking is voluntary and does not create an obligation in the legal sense. There is no remuneration — the POENs recorded after verified execution are ledger entries in the Protocol without external monetary value (Chapters 4 and 6.1). Operational contribution carries a greater labour-law risk than other forms of participation because it involves a defined task with execution conditions, but the absence of all three elements from Art. 5 precludes qualification as an employment relationship.

# 9. Modules

The KOLO system separates the foundation from the modules. The foundation — common good, Protocol, Foundation, community, POEN, ZRNO, users, proof of reality, financial and operational contribution (Chapters 3–8) — functions from day one and constitutes the minimum set of elements without which the system does not exist. Modules are extensions that add functionality to the foundation without changing it. Each module uses the same Protocol, the same ledger, and the same rules. Each is activated according to its own prerequisites, not in a predetermined sequence.

Modularity is a design decision. A system that attempts to do everything from day one is difficult to test, stabilise, and adapt. A system that begins with the foundation and adds modules can verify that the foundation works before burdening it, can test each module separately, and can adapt the sequence of activation to circumstances.

The order of modules in this chapter is logical, not chronological. Which module is activated first depends on the needs of the community and the decision of the Foundation or the Upper Kolo.

## Module 1: Circles

A Circle is an organisational unit of the system based on shared interest or activity. A group of users — acquaintances and like-minded individuals — who come together around a specific activity, skill, profession, or field for joint activities in the system.

Circles emerge from the bottom up — through association of users. Existing associations and cooperatives registered under the Law on Associations and the Law on Cooperatives may transfer their structure into a Circle that mirrors their composition and organisation, thereby integrating an existing organisational form into the system without the need for reorganisation.

Circles have an incentive function through a growth mechanism — the Protocol inscribes new POEN records in accordance with the number of Circle members and the reaching of defined thresholds. POENs arising through this mechanism are recorded in the Circle's ledger record as an organisational unit, not in the records of individual members. This is an incentive for organic expansion — the Circle grows as it expands and its position in the system reflects that growth.

A Circle has no legal personality. A Circle is not a legal entity, cannot enter into contracts, cannot hold property. A Circle is an organisational unit within the system, not an institution outside it. An association or cooperative that forms a Circle retains its legal personality independently of the Circle — the Circle is their form within the Protocol, not a replacement for legal status.

## Module 2: Cooperatives

A Cooperative is a local organisational unit of the system based on a territorial principle — by the village or city in which it is located. The Cooperative is the basic local structure through which the system expands and takes root in specific communities.

Unlike a Circle, which is an interest group without legal personality, a Cooperative is registered under the Law on Cooperatives and has full legal personality. This means that the Cooperative has a founding assembly, articles of association, registration in the Business Registers Agency, and all the obligations prescribed by the Law on Cooperatives (Art. 2–12). A Cooperative within the KOLO system is not a metaphor — it is a legal entity whose cooperative members use the Protocol and participate in the system from their territory.

The relationship between the Foundation and the Cooperative is regulated by a cooperation agreement, with the Cooperative retaining full autonomy as an independent legal entity.

The Cooperative has two functions within the system. The first is local coordination and the distribution of goods in the locality — the Cooperative is the structure through which exchange, communication, and organisation of activities take place in the settlement in which it operates. Users within the Cooperative find one another more easily and coordinate activities more easily because they share a geographical context. The Cooperative receives a good for distribution in the name and on behalf of its cooperative members: upon receipt, the Cooperative updates the ledger in favour of the user who brought the good, from its own record, and upon issuing the good to a cooperative member or to another Cooperative, the ledger is updated in favour of the Cooperative's record. The number of POENs for receipt and issuing is determined by the Cooperative, through its bodies and under its own rules — never by the Foundation. The second is a growth mechanism — the Protocol records the reaching of thresholds in the number of cooperative members in POENs in the Cooperative's record, by the same mechanism as in Module 1; each threshold is recorded once.

The Cooperative does not confirm the reality of users. Reality is confirmed only in the chain of confirmations (Chapter 7), and the Cooperative has no special role in it.

The participation of a Cooperative in the system is governed by the Rulebook on Cooperatives. A cooperative member is a participant whom the Cooperative has admitted to membership and whose account is linked to the Cooperative; a person may be a cooperative member in only one Cooperative. A cooperative member has all the rights belonging to them by status and, in addition, rights within the Cooperative — participation in distribution, in cooperative contribution, and in the use of the Cooperative's equipment and land. The status of cooperative member confers no additional authority in the system. A Circle and a Cooperative are the same collective form under different names: a Circle whose members register as a Cooperative continues as a Cooperative with the same record, and the thresholds it reached as a Circle are not recorded again.

Legal dimension: the Cooperative as a legal entity registered under the Law on Cooperatives has its own legal obligations — maintaining business records, annual reporting, observing cooperative principles. The cooperation agreement with the Foundation defines the rights and obligations of both parties in the context of the KOLO system, including Protocol usage rules and coordination mechanisms. The Foundation has no right to vote, to propose, or to give consent in the bodies of the Cooperative. The Cooperative does not become the owner of any part of the common good — the Cooperative's relationship to the common good is participatory, the same as the relationship of every user. Upon termination of the Cooperative's participation in the system, the Cooperative's record is closed, and the POEN recorded in it is annulled by a counter-entry in favour of the Protocol.

## Module 3: Social Programmes

Social programmes are a mechanism of automatic POEN recording for groups of users whose structural participation in the common good the Protocol recognises even though it does not manifest through individual activities — generational, solidarity-based, or structural. Automatic recording of new POENs for qualified groups has a redistributive effect: new records increase the total number of POENs recorded in the system, thereby changing the accounting coefficient for all users. This effect is a deliberate design decision — the system recognises that participation that is continuous and diffuse by its nature cannot be recorded through individual activities, and that the redistributive cost of that recognition is a trade-off the system consciously accepts for the sake of social cohesion.

The initial qualified groups are users whose contribution to the common good the system recognises as continuous. Parenthood constitutes a generational contribution that by its nature cannot be recorded through individual activities. Older users have contributed to the community over a lifetime — recording in POENs is recognition of accumulated contribution. Persons with disabilities participate in the community under conditions that require accommodation, not assessment of productivity. Students invest in their own development that is returned to the community — recording during the period of study is recognition of that investment. New groups may be added according to community needs and the decision of the Foundation or the Upper Kolo.

The mechanics are as follows: a participant belonging to a qualified group enters additional data confirming that status — parental status, age, disability, student status; the fulfilment of the conditions is confirmed by a Kolo member who knows them personally, and the application is approved by the Foundation. After approval, the Protocol automatically inscribes new POEN records for that support recipient daily, without the need for any specific activity. This is a category of POEN recording alongside donations, reaching of thresholds, operational contribution, verification, and sponsorship. The legal basis for automatic recording of POEN entries in social programmes is a decision of the Foundation (in the current phase) or the Upper Kolo (in a later phase) on Protocol rules, made within the framework of realising the Foundation's public-benefit objectives.

Automatic recording in social programmes is not remuneration — it pays for no work, service or other performance, nor is anything required of the support recipient in return towards the foundation. The programmes are carried out in pursuit of the objectives of the foundation laid down in Article 6 of the Statute, in particular social protection and solidarity support for vulnerable social groups, and they enable support recipients to participate in the system on a more equal footing.

Legal dimension: social programmes require verification of special categories of personal data — health status, disability, family status, age, student status. The processing of these data is subject to enhanced requirements in accordance with the Law on Personal Data Protection and the GDPR. The legal basis for processing is the explicit consent of the support recipient. Consent may be withdrawn at any time, with the consequence of cessation of automatic POEN recording. The protective measures and the rights of support recipients regarding special categories of data are described in Chapter 12.

## Module 4: Children

This module defines a special regime of rights, restrictions, and protections for minor users in the system, with additional restrictions for persons under the age of fifteen in accordance with Art. 16 of the Law on Personal Data Protection.

A minor user does not have the status of user, member without confirmation, Kolo member or Kolo keeper; their position is governed by the Rulebook on the Participation of Children. A minor may only open an account, but until the consent of a parent or legal guardian is given the account remains without access to system functions and without contribution recording. A child passes through three states: a waiting child, whose parent has not yet taken over the account; a child with a parent, whose parent has taken over the account but is not a Kolo member (but a user or a member without confirmation), or whose existence has not yet been confirmed; and a Kolo child, whose parent is a Kolo member and whose existence has been confirmed. The scope of activity in each state, the permitted scope of exchange, and the restrictions that apply are established by the Rulebook on the Participation of Children. A child who is not a Kolo child does not participate in POEN transfers in either direction, not even with a parent. The existence of a child is confirmed by a Kolo member who knows the parent personally, and the confirmation request is not visible to members without confirmation; no POEN is recorded on the basis of that confirmation, whoever confirms falsely is liable as for a false verification, and if the confirmation does not arrive, nothing is taken from the parent. A child does not enter the chain of confirmations. When the child comes of age, verification is given to them automatically by the first parent, in the order of linking, who is a Kolo member, and that verification is a confirmation; if no parent is a Kolo member but one is a member without confirmation, the first such parent introduces them into the Kolo; if no parent is in the Kolo, the adult user has no status other than that of user. A minor user may not inscribe ZRNO nor participate in governance through the Upper Kolo until they reach the age of 18 — this restriction protects the integrity of the governing body from legal complications related to the legal capacity of minors.

Legal dimension: the processing of data of minors is subject to enhanced requirements. Consent of a parent or legal guardian is a legal prerequisite for processing. Special data protection measures for minor users are part of the rules of this module and are aligned with the Law on Personal Data Protection and the GDPR. Protecting minor users from abuse, inappropriate content, and improper interaction is a design priority of this module.

## Module 5: Internationalisation

Internationalisation is the infrastructural expansion of the system to new regions. KOLO does not replicate — it does not create copies of the system with separate ledgers. The system extends its infrastructure, ledger, and rules to new territories, retaining a single Protocol and a single common good ledger.

Expansion to new regions requires adjustments in multiple dimensions: the legal framework of the target jurisdiction (particularly regarding data protection, tax treatment, and foundation status), language localisation of the platform, establishing a local chain of confirmations for proof of reality, and potentially forming local Cooperatives (Module 2) as organisational units in the new territory.

The prerequisite for activating this module is a stable system with an active Upper Kolo, sufficient experience with the functioning of the system in the core region, and legal analysis for target jurisdictions. The decision to expand is made by the Upper Kolo.

Legal dimension: expansion to the territory of the European Union requires full compliance with the GDPR. Expansion to other jurisdictions requires analysis of local regulations on data protection, digital assets, foundations, and cooperatives. The international institutional framework described in Appendix A — in particular the EU Action Plan for the Social Economy and UN resolution A/RES/77/281 — provides the starting framework for positioning the system in new jurisdictions.

# 10. Governance

Every system has rules. Someone must set those rules, someone must change them when circumstances change, and someone must ensure they are applied consistently. The question of governance is not whether someone governs the system — but who, how, and under what constraints.

The KOLO system addresses this question through progressive decentralisation — a structured path from centralised to decentralised governance with measurable transition conditions (cf. Walden, 2020). Governance begins centralised — with the founder and the Foundation — and is progressively transferred to the community through the Upper Kolo.

Decentralised governance requires three things that do not exist at the outset: a sufficient number of users for decisions to be representative, experience with the system for rules to be tested in practice, and proven stability of the foundation before governance is transferred. Centralised governance in the founding phase is a design necessity, not an ideological choice — every complex system begins with a small number of authors who lay the foundation before handing it over to a broader community for governance.

## Two Phases of Governance

In the first phase, the Protocol rules are set by the founder in collaboration with the Foundation. The founder has discretion that no one will have later — they can change rules quickly and adjust parameters on the basis of first experiences. But that discretion is not unlimited — the founder cannot change the four principles of Chapter 4, cannot change the licences under which the common good is published, and cannot appropriate the common good. These constraints are embedded in the system's Rulebook as a normative act of the Foundation, and simultaneously in the technical architecture of the system — thereby being protected both legally and technically. The first phase lasts until the total number of POENs recorded in the system reaches 1,000,000. In the accounting logic, the Protocol that inscribes new POEN records carries a negative balance — each new POEN record reduces the Protocol's balance by one — so the threshold of one million recorded POENs corresponds to a Protocol balance of −1,000,000.

In the second phase, the Upper Kolo becomes the system's governing body. The Upper Kolo emerges automatically with the activation of ZRNO. There is no separate activation step, no additional prerequisites: one million POENs is the threshold that simultaneously activates ZRNO and establishes the Upper Kolo. One threshold, one transition. The Upper Kolo comprises the Kolo keepers who have activated ZRNO, including the founders: upon activation ZRNO turns into voting power, while free ZRNO does not confer a seat in the Upper Kolo. A Kolo keeper joins the Upper Kolo by activating ZRNO and leaves it when none of their ZRNO is active any longer, or upon the lapse of the confirmation of reality. Since the number of active ZRNO and voting power change constantly, the composition of the Upper Kolo and the voting power of each Kolo keeper are determined from the Protocol's ledger separately for each accounting period and apply only during that period. It decides on Protocol rules, on the activation and deactivation of modules, and on all matters that affect the common good, except matters excluded from its jurisdiction in accordance with the system's Rulebook. The types of decisions, decision-making thresholds, quorum, and voting procedure are established by the Rulebook on the Upper Kolo. With respect to the allocation of funds in dinars, the Upper Kolo issues recommendations to the Foundation's Board of Directors, which considers and applies them within the scope of its statutory powers under the Law on Endowments and Foundations — with an obligation of a reasoned response to each recommendation. In this phase the Foundation retains a service role — it maintains the infrastructure, represents the system in legal dealings, and implements the decisions of the Upper Kolo. The Upper Kolo is a body established by a rulebook of the foundation and is not among its organs established by the statute; a decision of the Upper Kolo is implemented by the Board through its own act, which it is obliged to adopt, and may refuse only if the decision is contrary to law or to the statute, encroaches on matters excluded from the competence of the Upper Kolo, or is covered by the protective veto — always with published reasons. Competence thus remains where the law places it, while the foundation binds itself by its own act to act upon the decision. The Foundation also retains a protective veto over decisions of the Upper Kolo. The veto lapses permanently and irreversibly when the Foundation's financial resources reach the threshold of financial self-sufficiency established by a special rulebook.

## Quadratic Voting and Delegation

The Upper Kolo makes decisions by quadratic voting (Posner and Weyl, 2018; Lalley and Weyl, 2018) — a mechanism in which voting power equals the integer value of the square root of the number of active ZRNOs, rounded down. Free ZRNO does not confer voting power — a Kolo keeper who wishes to vote must activate ZRNO, thereby forgoing the possibility of redemption until they return it to free status (Section 6.2). ZRNO is not consumed by voting.

This mechanism addresses two problems of classical voting: the majority problem and the plutocracy problem. The square root ensures that voting power grows more slowly than the number of active ZRNOs — a Kolo keeper with 100 active ZRNOs has 10 votes, not 100 — thereby preventing the concentration of governing power. Voting power derives from activated ZRNO, not from the number of POENs and not from donations in dinars.

Kolo keepers who do not wish or are unable to participate in every vote may delegate their votes to another Kolo keeper (cf. Ford, 2002; Blum and Zuber, 2016). Votes are delegated, not ZRNO — the delegator retains ZRNO in their ledger record and may withdraw the delegation at any time. Delegation is general — the delegate votes on behalf of the delegator on all matters for the duration of the delegation. Delegated votes are added to the delegate's own votes without re-applying the square root — a delegate who has 4 own votes (√16 active ZRNOs) and receives 3 delegated votes casts a total of 7 votes, not √49. Delegation addresses the participation problem — it ensures that the voting power of inactive Kolo keepers is represented rather than lost. The non-transferability of ZRNO remains complete. The rules of delegation, including the effects of revocation and restrictions on delegation, are established by the Rulebook on the Upper Kolo.

## Protective Measures

The Upper Kolo does not have unlimited power. Three constraints are embedded in the system's design.

The first constraint is the four principles of the system (Chapter 4). No decision of the Upper Kolo may abolish non-convertibility, introduce a proprietary right over ledger records, make donations refundable, or abandon the principle of data minimisation. These principles are above the governing power of the Upper Kolo because abolishing them would change the legal nature of the system — KOLO without these principles ceases to be a participatory common good system and falls under regulatory frameworks intended for financial instruments, payment services, or investment schemes.

The second constraint is the Foundation's protective veto — the right to refuse execution of a decision that would jeopardise the operational and financial sustainability of the Foundation before it achieves financial self-sufficiency, in particular decisions on the spending of funds in dinars that would undermine the Foundation's capacity to cover basic costs and maintain system infrastructure. The veto is not discretionary — the Foundation must justify each veto by reference to a specific threat to sustainability, and a veto without justification constitutes an abuse subject to liability in accordance with the system's Rulebook. The four principles, the common good licences, and the legal obligations of the Board of Directors remain protected independently of the veto. The protective veto lapses permanently and irreversibly when the Foundation's financial resources reach the threshold of financial self-sufficiency established by a special rulebook. The lapsing of the veto is irreversible because any mechanism that would allow the veto to be reinstated would simultaneously be a mechanism that would give the Foundation the ability to recentralise governance. The lapsing of the veto is in the Foundation's interest because the threshold of financial self-sufficiency marks the moment at which the Foundation has sufficient resources to launch programme activities that significantly increase the utility of the system for all users and thereby strengthen the operational sustainability of the system. The lapsing of the veto does not extinguish the legal obligations of the Board of Directors — the Board remains legally responsible under the Law on Endowments and Foundations and may not execute a decision that would violate applicable law, regardless of whether the protective veto exists.

The third constraint is the licences (Chapter 3). The Upper Kolo may not replace AGPL-3.0 and CC BY-SA 4.0 with more restrictive licences.

In the event of the Foundation's cessation, the common good does not cease to exist — the software and content remain available under the terms of the licences, and the ledger and infrastructure are transferred to a legal successor that accepts the four principles of the system and takes over the obligation of safeguarding the common good. The rules of transfer are established by the Statute and a special act of the Foundation.

## What Governance Is Not

Governance of the KOLO system is not corporate governance. There are no shareholders, no dividends, no board of directors maximising value for owners.

Governance of the KOLO system is not state governance. There is no territory, no coercion, no monopoly on force. Participation is voluntary. A user who disagrees with the decisions of the Upper Kolo retains the right of exit from the system (cf. Hirschman, 1970) — in that case, their rights in connection with the ledger record are exercised in accordance with Chapter 12 (Data Protection).

Governance of the KOLO system is governance of a common good. Kolo keepers who have activated ZRNO — Kolo members who have recorded contribution and recorded position — decide on the rules of a system that is the collective good of all users. Their relationship to the system is participatory: the right to use, contribute, and participate in governance, not the right to dispose. Progressive decentralisation ensures that this governing right is assumed by those who are ready to exercise it responsibly.

# 11. Game Theory and Incentives

The preceding chapters describe what the system is and how it works. This chapter analyzes why it works — what motivates each user to take part, why cooperation is structurally more advantageous than abuse, and which mechanisms discourage behavior that would compromise the integrity of the system. The analysis draws on concepts from mechanism design theory (Hurwicz, 1960, 1973; Myerson, 1981; Maskin, 1999), common-pool resource governance (Ostrom, 1990), the logic of collective action (Olson, 1965), and the evolution of cooperation in iterated interactions (Axelrod, 1984).

This analysis is not a promise. The system does not guarantee that every user will benefit, does not guarantee that abuse will never be attempted, and does not guarantee that all incentives will function as intended. This analysis describes the structural incentives embedded in the system's design and explains why, on the basis of those incentives, it is rational to expect the system to function — but also where tensions exist that the system recognizes and manages. In the terminology of mechanism design theory, the question is whether KOLO is incentive-compatible — whether the system's rules are designed so that the rational behavior of each user leads to a desirable collective outcome (Hurwicz, 1973). The answer is not a simple "yes" — different activities within the system have different incentive profiles, and one structural question — the relationship between accumulation and circulation — requires separate analysis.

## Incentives of System Users

A system user derives immediate benefit from participation — they exchange goods and services with other users. The more users there are in the system, the greater the probability that a user will find what they are looking for and that someone will be looking for what they offer. This is a positive network effect (Katz and Shapiro, 1985) — the utility of the system for each individual user grows with the number of users, thereby reducing the double-coincidence-of-wants problem that constrains direct exchange (Jevons, 1875).

A system user also has a second motivation. Activities that constitute a user's contribution — donations, sponsorship, operational contribution, and verifying users — lead to the accumulation of POEN records in the user's record. Accumulated POEN records are a prerequisite for ZRNO inscription — a participant who actively contributes to the system progressively approaches the threshold at which they can inscribe ZRNO and thereby acquire the right to participate in governance and a position in the accounting system (section 6.2).

These two incentives — the immediate benefit from exchange and the long-term position through accumulation — are not always aligned. The exchange of goods and services redistributes existing POENs among users (zero-sum, section 6.1) — a user who gives a good or service reduces their own number of recorded POENs, thereby also reducing their own capacity to inscribe ZRNO. Activities through which new POENs arise — donations, verification, operational contribution, reaching thresholds — increase a user's number of recorded POENs without others losing any. A rational user who wants to maximize their own position for ZRNO inscription has a structural incentive to favor activities through which new POENs arise over exchange that redistributes them. This tension between accumulation and circulation — analogous to the problem that the literature on complementary currencies identifies as the central design dilemma (Gesell, 1916; Lietaer, 2001; Greco, 2009) — deserves separate analysis and is given in the section "Tension Between Accumulation and Circulation" later in this chapter.

In the early stage of the system with a small number of users, the immediate benefit from exchange may be limited. This is the classic cold-start problem — the system has value only when it has enough users, but users have no reason to join while the system has no value. KOLO addresses this problem in two ways. First, the first users come from existing social networks — through the chain of confirmations in which Kolo members bring in people they personally know, ensuring that the early community has pre-established trust relationships and realistic exchange possibilities. Second, the POEN records that accumulate from day one retain their value as the system grows — early users who acquired records at a lower accounting coefficient have a position that reflects their contribution during the phase when contribution was most valuable for establishing the system. This structure encourages early participation without promising a return — the benefit to an early user depends on whether the system actually grows, which is not guaranteed.

This structure addresses the free-rider problem that Olson (1965) identifies as the central obstacle to collective action — but only at the level of activities through which new POENs arise: a user who donates, verifies, or performs operational tasks simultaneously contributes to the common good and builds their own position. At the level of exchange, the relationship is different — a user who exchanges contributes to the common good (increases the volume of activity and makes the system more useful for all other users), but in the same act reduces their own number of recorded POENs. At the level of infrastructure financing, the free-rider problem remains — a user who does not donate uses the infrastructure financed by donors. This is a structural asymmetry that the system does not eliminate but mitigates: the incentive structure for donors, described later in this chapter, ensures that donating is rational for users who actively use the system, but does not compel anyone to donate.

## Incentives of Verifiers

A verifier is a Kolo member, a founder, or a member without confirmation who establishes the reality of a user — by confirmation or by introduction into the Kolo — on the basis of personal acquaintance or of a conversation after a call (chapter 7). The verifier has two incentives.

The first is contribution records. The Protocol notes the act of verification as a contribution to the common good — upon a verification the same, fixed amount of POEN is recorded to the verifier and to the verified person, once per verified person, and only when the verified person makes their first confirmed contribution. The act of verification is a contribution to the integrity of the system because it ensures that behind an entry in the ledger stands a real person.

The second is network expansion. A verifier who brings a new user into the system expands the exchange network, which is also useful to them — more potential exchange partners. This incentive is aligned with the collective interest because network growth is beneficial for all users.

The verifier also has a structural constraint — they put their own position in the system at stake as a guarantee of the accuracy of the verification. The consequences of false verification ensure that the cost of false verification is greater than the benefit of it: a false verification is annulled together with the POEN records that arose from it, and whatever was extracted from the network on its basis falls on the verifier as compensation, which may bring their record into a negative value and is not limited by a ceiling (Art. 20b of the Rulebook on Proof of Reality); in addition, an established false verification is as a rule a ground for the exclusion of the verifier, and the Foundation may also impose a suspension, under the procedure set out in the Terms of Use and subject to the right to a complaint (Art. 21 of the Rulebook on Proof of Reality). A verifier who confirms falsely risks their own POEN record and their position in the system. This structure means that the rational choice for a verifier is to confirm only persons whose reality they actually know — the benefit from a single false verification (POENs for verification) is disproportionately smaller than the potential loss (the entire position in the system).

## Incentives of Kolo Keepers

A Kolo keeper has all the incentives of a system user, plus two additional ones: participation in governance through the Upper Kolo and a position in the accounting system whose value changes with the activity of the community (chapters 6 and 10). Both additional incentives are aligned with the collective interest — a Kolo keeper wants the system to grow because their position depends on collective activity. The benefits and limitations of that position are qualified in section 6.2.

A Kolo keeper also has the option of redemption — returning free ZRNO to the pool of available units, with the Protocol recording POEN at the current accounting coefficient (section 6.2). That option is not an incentive: the difference against the number of POEN used upon inscription arises in both directions, no person promises it, and one's own inscription and redemption do not shift the coefficient (section 6.3). Any benefit is moreover limited to the internal exchange capacity, because POEN cannot leave the system. At the same time, the structural choice between the governance function (active ZRNO) and accounting flexibility (free ZRNO) prevents simultaneous realization of both benefits.

At the individual level, a Kolo keeper has an incentive for others to exchange and contribute, while themselves favoring activities through which new POENs arise over exchange that reduces their own number of recorded POENs. This asymmetry is a structural feature that arises from the tension between accumulation and circulation described later in this chapter. A Kolo keeper cannot derive benefit from their position at the expense of other users in the sense of extracting value from the system — ZRNO cannot be transferred, cannot be sold, and cannot be monetized.

## Incentives of Donors

A donor gives monetary funds to the Foundation non-refundably (chapter 4). The immediate incentive is the same as for every user — they use the system and benefit from its functioning. The donation finances the infrastructure that maintains the system the donor uses, following the logic that corresponds to the model of club goods (Buchanan, 1965). The difference relative to classical club goods lies in the exclusion mechanism — KOLO does not exclude users who do not donate from using the system, but a donor acquires contribution records that may bring them closer to the ZRNO inscription threshold, whereas a user who does not donate can meet that threshold only through other activities.

In the context of the tension between accumulation and circulation, donation has a special incentive property: it is the only activity in the system through which new POENs arise for the user while simultaneously financing the infrastructure of the common good. The non-refundability structure functions as a selection mechanism — it attracts users who are motivated by using the system, not those seeking an investment return — donating is rational only for users who genuinely use the system and benefit from its functioning (Hurwicz, 1973).

## Position of Sponsors

A sponsor is a legal entity, an entrepreneur or a holder of a registered agricultural holding that donates money to the Foundation or undertakes to give goods and services to persons designated by the Foundation (section 8.2). Sponsorship is a public record — the foundation keeps and publishes the record of sponsors as part of the system's transparency, not as an advertising service; the record contains the sponsor's name and logo and displays nothing else besides them, and the sponsor acquires no right to promotion or any other counter-performance. The contribution is recorded in the record of the user who submitted the application, under the same table as a personal donation, and arises only if the community receives actual funds or if the giver assumes an obligation for which it answers by a write-off.

## Tension Between Accumulation and Circulation

Every system that uses an internal accounting unit to record contributions faces a fundamental question: does the incentive structure favor circulation (exchange between users) or accumulation (holding records for the purpose of positioning)? At the beginning of the twentieth century, Silvio Gesell identified accumulation — hoarding — as the central obstacle to circulation in exchange systems and proposed demurrage (a holding cost) as the solution (Gesell, 1916). LETS systems, time banks, and local currencies face the same problem in different variants — insufficient circulation is one of the empirically documented reasons why many complementary systems remain small or fade away (Seyfang, 2006; North, 2007).

The KOLO system has this tension embedded in its incentive structure and recognizes it as a design choice, not a defect. The incentive structure is as follows.

Activities that constitute a user's contribution — donations to the Foundation, sponsorship, operational contribution, and verification of users — increase the user's balance and simultaneously contribute to the common good. For these activities, individual and collective incentives are aligned: the user builds their own position and contributes to the system at the same time.

The exchange of goods and services — declared as the central activity of the system — redistributes existing POENs among users (zero-sum). A user who gives a good or service reduces their own number of recorded POENs. For a user who aims to inscribe ZRNO (minimum 20,000 POENs, section 6.2), every exchange in which they give more than they receive delays the moment of reaching the threshold. A rational user who maximizes their own position for ZRNO inscription has an incentive to favor donations and verification over exchange.

This tension is a deliberate design choice with three rationales.

First, the immediate benefit from exchange exists independently of POEN records. A user who exchanges one hour of their labor for one hour of another's labor has received something they need — that result has value regardless of any change in the POEN balance. POENs record that the exchange took place, but the benefit of the exchange does not lie in the POENs but in the good or service the user received. A user does not exchange because they want POENs — they exchange because they want what another user offers. The POEN record is a consequence of the exchange, not its purpose.

Second, a system that rewarded circulation — for example, by crediting bonus POENs for each exchange — would open the door to fake exchange: two users could exchange back and forth without any real exchange of goods or services, solely to obtain bonuses. The zero-sum nature of exchange is a structural protection against this type of manipulation — when exchange does not increase the total number of POENs, fake exchange has no benefit for the manipulator. The system consciously chooses protection from manipulation over incentivizing circulation.

Third, the flow of money into the Foundation's fund — which is then spent on infrastructure and programs — is more important for the operational sustainability of the system than the circulation of POENs within the accounting framework. An incentive structure that favors donations over exchange aligns individual behavior with the operational needs of the system: a user who donates finances infrastructure that everyone uses, while a user who only exchanges uses the infrastructure without contributing to its maintenance.

This design choice has consequences that the system recognizes. Users who have more resources to donate can reach the ZRNO inscription threshold faster than users who contribute exclusively through exchange. This is not a structural injustice — donation is not a privileged path to ZRNO; all paths use the same threshold — but it is an asymmetry in the speed of reaching that threshold. The system mitigates this asymmetry in two ways: through operational contribution and verification, new POENs arise without a monetary cost, enabling users without donation resources to build their position through contributions of time and activity; through social programmes (Module 3, chapter 9), new POENs automatically arise for qualifying groups of users whose contribution to the common good is indirect. Neither of these mechanisms completely eliminates the asymmetry — a user who donates and exchanges and verifies builds their position faster than a user who only exchanges. The question of whether this asymmetry is acceptable or requires correction remains open and is resolved through the governance processes described in chapter 10 — the parameters that affect the relationship between accumulation and circulation are precisely the kind of question the Upper Kolo decides on the basis of empirical experience with the functioning of the system.

## Why Cooperation Is Structurally More Advantageous Than Abuse

Every system with records and accounting attracts attempts at abuse. Ostrom (1990) identifies monitoring mechanisms and graduated sanctions as key design principles for protecting common goods. The KOLO system has several structural features that make abuse more costly than cooperation.

Proof of reality as a barrier. Creating a fake profile in the KOLO system requires that a verifier — a Kolo member or a member without confirmation — verifies the fake person, thereby putting their own position in the system at stake — graduated sanctions include a ban on verification, revocation of the right to ZRNO, and account cancellation. The cost of an attack is not the forgery of a document but the corruption of a real person in the trust network, which is disproportionately more expensive and risky than creating an anonymous account on a classical internet platform. The POEN record for a verification arises only once the fake account passes a human decision on its first contribution, so a false verification by itself yields nothing. This analysis holds for a system in which the verification graph is sufficiently dense that the corruption of a single node has no systemic effect. As the system grows — especially geographically, beyond the region where a dense acquaintance network exists — the risk of coordinated false confirmations increases, and with it the weight of supervision by Kolo keepers in new environments. Open questions regarding the scaling of proof of reality are listed in chapter 13.

Records as a trail. Every activity in the system is recorded. Every exchange has two users. Every contribution has a record. False records — two users who falsely exchange in order to redistribute POENs without any real exchange of goods or services — leave a trail that differs from legitimate activity by its patterns: exchanges always between the same users, in the same amounts, at regular intervals. Since exchange does not increase the total number of POENs in the system (zero-sum, section 6.1), the benefit of false exchange is limited to the redistribution of existing records — meaning that one of the two users loses POENs so that the other gains them. False exchange therefore requires an agreement between two users of whom one consents to a loss, which narrows the range of possible abuses to coordinated pairs with an external motive.

The ZRNO inscription limit. A maximum of one percent of the balance per accounting period (section 6.2) means that even a user with a large POEN record cannot suddenly acquire a significant share of available ZRNOs. Building a position in the system is a gradual process that takes time, which reduces the benefit of manipulation and increases the probability of detection before manipulation achieves a significant effect.

Non-transferability of ZRNO. ZRNO cannot be transferred to another user (section 6.2). This eliminates an entire category of abuse — there is no possibility of someone accumulating ZRNO and alienating it to another person, no possibility of governance power concentrating through collecting ZRNO, no possibility of monetizing a position in the system outside the system.

The non-convertibility of POENs (chapter 4) means that false records have no external value. A user who manipulates records can accumulate POENs, but cannot take them out of the system. POENs have intra-systemic value — they serve for exchange with other users within the system — but that value is structurally limited to what other users offer, and a user who undermines the integrity of the system simultaneously diminishes the value of their own records for all other users. In the terminology of game theory, record manipulation is a dominated strategy — for every scenario in which a user might manipulate, legitimate participation yields equal or greater benefit without the risk of sanctions.

Non-convertibility does not eliminate the possibility that users within the system exchange goods and services that have value in the external economy — nor is that its purpose. Two users who exchange an hour of labor, a kilogram of honey, or a roof repair through the system are conducting legitimate internal exchange, regardless of the fact that those goods and services have a market value expressed in dinars. The Protocol records the exchange by updating both users' records — that is the basic function of the system described in section 6.1. Non-convertibility means that there is no mechanism through which a user could take POENs out of the system and exchange them for dinars — not that the goods and services exchanged within the system have no value outside it. The distinction lies in where the value is realized: a user who receives a service benefits from that service, but the POENs through which the exchange was recorded have no independent external value and cannot leave the system.

Transparency. The Protocol's rules are public. Records are available to system users in pseudonymous form (chapter 12). Decisions are substantiated. In an environment where rules and records are available to all users, abuse requires that all other users fail to notice irregular patterns — which becomes increasingly difficult as the system grows.

In addition to the structural features described in this section, the system also has active protection mechanisms — anomaly detection in the verification graph, monitoring of exchange patterns in pseudonymous form, verification of the execution of operational tasks by Kolo keepers, and measures against coordinated action by connected persons. Specific mechanisms, detection rules, and procedures for handling violations are defined in the Rulebook on the KOLO System and the Rulebook on Proof of Reality.

## System Equilibrium

The incentives in the KOLO system are designed with the goal that legitimate participation is the structurally more advantageous choice for every user over abuse or non-participation. In the terminology of mechanism design theory, the goal is for legitimate participation to tend toward a Nash equilibrium — a state in which no user has an incentive to unilaterally change their strategy (Nash, 1950). This claim is a design intention based on the analysis of structural incentives described in this chapter — formal verification requires empirical analysis of user behavior after the system begins operation, including monitoring of exchange patterns, abuse rates, and the effectiveness of anti-fraud mechanisms.

A user who legitimately uses the system has an immediate benefit from exchange and a possible long-term benefit from accumulated records. A user who attempts to abuse the system invests effort in manipulation whose external value is zero (non-convertibility), whose intra-systemic value is limited (zero-sum exchange), and whose risk of detection is proportional to the scale of manipulation (transparency of records). A donor who donates funds to the Foundation finances infrastructure that they themselves use, under conditions that are structurally rational only for users who genuinely use the system — not for those who expect a financial return. A sponsor who provides real resources receives a public record of contribution in a system whose benefit depends on the functioning of the system.

Incentive alignment in the KOLO system is not uniform across all activities. Activities through which new POENs arise — donations, verification, operational contribution — have a high degree of alignment between individual and collective interest: the user builds their position and contributes to the system simultaneously. Exchange — the central activity of the system — has lower incentive alignment: the user obtains an immediate benefit (a good or service), but in the same act reduces their own number of recorded POENs, which slows the achievement of the ZRNO inscription threshold. The system accepts this tension because the immediate benefit of exchange — the ability to get what you need from another user — exists independently of POEN records and does not require an additional incentive to be beneficial. Whether this design choice produces sufficient circulation in practice is an empirical question that will be resolved by monitoring usage patterns and, where necessary, adjusting system parameters through the governance processes described in chapter 10.

The system is not immune to abuse. No system is. But a system in which abuse is costly (proof of reality, graduated sanctions), detectable (transparency of records, pattern monitoring), and of structurally limited benefit (non-convertibility, non-transferability) has better structural prospects than a system that relies on the goodwill of users — a problem that Olson (1965) identifies as the central vulnerability of collective action systems, and that Ostrom (1990) resolves precisely through the combination of clear rules, monitoring mechanisms, and graduated sanctions.

# 12. Data Protection

The KOLO system by its nature processes personal data — the verification graph, contribution records, donation data, and, in the context of social programmes and the children's module, special categories of data. The approach to data protection is based on privacy by design and by default (Art. 50 LPDP; GDPR Art. 25). The system applies the Law on Personal Data Protection (LPDP; Official Gazette of the Republic of Serbia, No. 87/2018) and, to the extent applicable, the General Data Protection Regulation of the European Union (GDPR; Regulation (EU) 2016/679).

## Three Design Decisions

The first is the pseudonymity of records. Entries in the ledger are linked to pseudonyms, not to personal names. The user's first and last name is kept only in the identity register, separately from the contribution records, and is entered only in five cases: upon registering a farm and joining a farm, upon a public donation, upon acquiring the status of cooperative member, upon confirmation of receipt of a sponsorship, for the representative who submitted the application, and upon entering the call list, when it is entered by the user themselves (Rulebook on the KOLO System, Art. 31a). It is not displayed to other users, except to the Kolo member who calls a user from the call list in order to get acquainted, and only while the call is open (chapter 7), and is not included in POEN records. Pseudonymity is not anonymity (cf. LPDP Art. 4 para. 1 item 3a; GDPR Art. 4(5) and Recital 26) — pseudonymized data remains personal data within the meaning of the LPDP because it can, with additional information, be linked to an identified person. The risk of re-identification is proportional to the density of the graph and the number of verifications.

The second is data separation. The Foundation does not store personal data of platform users — all user data is stored on the Protocol's infrastructure. The Foundation directly stores only the banking documentation of donations (legal obligation of financial reporting) and a record of the link between the legal entity sponsor and the user whose system record the contribution is credited to (chapter 8).

The third is minimization — the platform collects only the data necessary for the operation of the system: pseudonym, email address, date of joining, the verification graph, and the verification and confirmation status datum. The user may voluntarily enter additional data for ease of use of the platform, but this is not a condition for proof of reality nor for access to system functions.

## Data Categories

The system processes several categories of personal data, with the minimization principle embedded in the design — the platform collects only the data necessary for operation, the Foundation does not store personal data of platform users, and the user themselves decides which additional data to enter.

Data about platform users: pseudonym, email address, date of joining. Necessary for the functioning of the system.

Proof of reality data: the verification graph, including the information whether a verification is a confirmation or an introduction into the Kolo, and the verification and confirmation status datum. Operational system data that records the relationships between users and their verification — without them it is impossible to ensure the principle of one person, one account.

Voluntarily entered data: name, address, contact details — the user decides whether to enter them and can delete them at any time.

Activity data: records of exchanges and contributions in pseudonymous form — entries that form the basis of the accounting framework.

Donation data: amount, date, identity of the donor — stored by the Foundation on the basis of the legal obligation of financial reporting. Donor identification is ensured through the banking system.

Sponsorship data: contributions of legal entities and the link between the legal entity and the user whose system record the contribution is credited to. The user's first and last name is kept only in the identity register, separately from the contribution records, and is not displayed to other users, except in the case of a call from the call list.

The identity register arises in five cases — a farm, a public donation, the status of cooperative member, a sponsorship (the name of the representative who submits the application) and the call list (the name is entered by the user themselves): the first and last name is kept alongside the account's pseudonym, one per account, for the purpose of the principle of one person, one account. It is not displayed to other users, except to the Kolo member who calls a user from the call list in order to get acquainted, while the call is open, is not included in POEN records, and is deleted upon closure of the account.

Special categories of data may arise in the context of social programmes (Module 3): parent status, age, disability, student status. The Foundation does not store copies of submitted documentation — only the minimal record of group membership and the date of status verification remains in the system.

Data of minors arise upon activation of Module 4: data about minor users, consent of a parent or legal guardian, and the restrictions that apply to a minor user.

Data of cooperative members arise upon activation of Module 2: the first and last name and the pseudonym of the cooperative member, submitted by the Cooperative with the consent of the person concerned, for the purpose of linking the account to the Cooperative and counting cooperative members for the growth thresholds. The first and last name are not displayed to other users and are entered in the identity register.

Farm data arise when an adult user registers a farm: the name, settlement and exact location, description of production, role of the applicant, the agricultural holding number where the farm is entered in the register, and the pseudonyms of members. The first and last name of each member is entered in the identity register, not alongside the farm; the Foundation does not check the data in the register. The extract from the register is not attached. A farm, entered or not entered in the register, is registered by any adult user as holder; the registration places the user on the call list (chapter 7), but does not confirm their reality. An approved farm is displayed on the public map, which also shows sponsors; the address is written out on the basis of the applicant's statement given in the application, and the holding number is not displayed. The display is an integral part of the farm's participation and a condition of the farm contribution (Rulebook on Farms).

## Legal Basis for Processing

The processing of personal data requires a legal basis (Art. 12 LPDP). The KOLO system uses different legal bases for different categories of data.

For data about platform users and proof of reality data, the legal basis is the performance of a contractual relationship (Art. 12 para. 1 item 2 LPDP) — by joining the system the user accepts the terms of use, which constitute a contractual relationship with the Foundation as the controller.

For voluntarily entered data, the legal basis is the user's consent (Art. 12 para. 1 item 1 LPDP).

For activity data, the legal basis is the performance of a contractual relationship for as long as the user participates in the system. After the user leaves the system and requests deletion, identification data is deleted, and the records that remain in the ledger are retained under a pseudonym that does not point to a name; this is pseudonymisation, not anonymisation, and the retained records are still personal data (section on the right to erasure below).

For donation data, the legal basis is a legal obligation (Art. 12 para. 1 item 3 LPDP). For sponsorship data, the legal basis is the legitimate interest of the Foundation (Art. 12 para. 1 item 6 LPDP) and the legal obligation of maintaining financial records.

For special categories of data, the legal basis is the explicit consent of the user (Art. 17 para. 2 item 1 LPDP). Consent may be withdrawn at any time, with the consequence of terminating the automatic recording of POENs.

For data of minors, the legal basis is the consent of a parent or legal guardian (Art. 16 LPDP).

## Data Controller

The KOLO Foundation is the data controller within the meaning of the LPDP — it determines the purposes and means of processing. The Foundation is the controller even when it does not physically store user data: the legally relevant criterion is determining the purpose and means of processing, not physical data storage (Art. 2 para. 1 item 8 LPDP). The Protocol is a technical means of processing. If the Foundation engages third parties for infrastructure maintenance, those parties are data processors within the meaning of the LPDP (Art. 45).

## Tension Between the Right to Erasure and the Integrity of Records

The LPDP (Art. 30) gives the user the right to request the deletion of their personal data. KOLO maintains a contribution ledger that is by design consistent — deleting the records of a single user would compromise the consistency of the entire ledger, which is the common good of all users. This tension is resolved by separating data into identification and accounting components: a user who leaves the system receives deletion of their email address and all voluntarily entered data, anonymization of connections in the verification graph, while the entries in the ledger remain under a pseudonym that does not point to the name. This is pseudonymization, not anonymization: the Foundation retains the internal account identifier, so the retained entries still constitute personal data within the meaning of the LPDP, and they are kept because the right to erasure is not unlimited (Art. 30 para. 3 LPDP).

## Obligations of the Foundation

The Foundation is obliged to carry out a Data Protection Impact Assessment (DPIA) before commencing processing (Art. 54 LPDP), to appoint a Data Protection Officer (DPO, Art. 56 LPDP), and to apply technical and organizational protection measures proportionate to the risk (Art. 51 LPDP). Module 3 (Social Programs) and Module 4 (Children) were activated only after the DPIA was updated, because they introduce the processing of special categories of data (Art. 17 LPDP) and data of minors (Art. 16 LPDP). If the system's infrastructure includes servers outside the Republic of Serbia, the transfer of personal data outside the country is subject to the LPDP rules on cross-border transfer (Arts. 65–69).

System users have all the rights guaranteed to them by the LPDP — the right of access (Art. 26), rectification (Art. 29), erasure (Art. 30), restriction of processing (Art. 31), portability (Art. 36), and objection (Art. 37). The Foundation provides a mechanism for submitting requests that is accessible to all users and responds to requests within thirty days of receipt of the request (Art. 21 para. 3 LPDP), with the possibility of extension by a further sixty days with notification to the user of the reasons for the extension. A detailed description of data categories, legal bases of processing for each category, users' rights, technical and organizational protection measures, and rules on cross-border transfer is given in the KOLO System Privacy Policy. Technical protection measures are described in Appendix D of this document.

# 13. Development Trajectory

The KOLO system is not a finished product launched in final form. It is a system that is built gradually, tested in practice, and adapted on the basis of experience. This chapter describes the expected trajectory of that development — phases, thresholds, open questions, and structural limits that the system never crosses.

The trajectory is not a fixed plan with dates. The thresholds are measurable, but the time needed to reach them depends on the rate of community growth, the capacity of the Foundation, and circumstances that no one can predict. This chapter describes the sequence and conditions, not a calendar. The approach corresponds to what the literature on decentralized systems describes as a designed trajectory with measurable transition conditions (cf. Walden, 2020).

The trajectory has a pre-operational founding phase, two operational phases with a measurable transition threshold, and a modular phase in which the system develops according to its own rules. The founding phase precedes the operational work of the system. The two operational phases are sequential — the second begins when the transition threshold from the first is met. The modular phase is not sequential — modules are activated independently, when their own prerequisites are met, not in a predetermined order.

## Founding Phase

The Foundation is registered in Sombor. The Protocol is developed and tested. The system's rules are defined in their first version. Licenses are set — AGPL-3.0 for software, CC BY-SA 4.0 for content. The Whitepaper is published. The legal position of the system is established.

In this phase there are no users, no records, no accounting. The system exists as code, rules, and a legal framework. The Foundation holds the infrastructure and prepares for the reception of the first users.

Prerequisites for the start of Phase 1: a functioning Protocol, a registered Foundation, a published Whitepaper, established infrastructure, defined rules for proof of reality.

## Phase 1: Foundation

In this phase the entire foundation of the system is activated — all elements described in chapters 3–8.

The Protocol begins to maintain records. The first POEN entries arise through the first user contributions.

Proof of reality is activated (chapter 7). The first group of users passes verification through the chain of confirmations. The founders provide the verification capacity for starting the chain of confirmations.

Financial contribution is activated (chapter 8). The first donations begin to arrive. The financial flow between the community and the Foundation is established in practice. The Foundation begins to spend monetary funds on infrastructure and programs.

Operational contribution is activated (chapter 8). Users apply for tasks for the common good by submitting an execution plan. Members of the Foundation's Board of Directors approve plans and verify daily execution. Upon activation of the Upper Kolo in Phase 2, this function is taken over by Kolo keepers. The limit of 10% of the total number of POENs recorded in the system per accounting period protects the system from inflationary pressure; this limit is an operational parameter subject to change through the governance processes (chapter 10).

This phase is operationally the most demanding. The system encounters real-world use for the first time. Rules that seemed logical on paper may prove impractical, unbalanced, or insufficiently precise. The founder and the Foundation actively adjust parameters during this phase — how many POEN entries the Protocol credits for which activity, how the accounting period functions, how records are displayed to users. The number of users is small — sufficient to test the mechanics, insufficient to test scaling. The expectation is that the first users will be persons who understand the system's design and who accept the limitations of an early version.

Threshold for transition to Phase 2: the total number of POENs recorded in the system reaches 1,000,000 — a Protocol balance of −1,000,000 POENs (see chapter 10 for an explanation of the accounting convention). This threshold simultaneously activates ZRNO inscription and establishes the Upper Kolo as the system's governing body.

## Phase 2: ZRNO and Upper Kolo

When the total number of POENs recorded in the system reaches one million, the accounting coefficient reaches its minimum value of 1 — one million POENs divided by one million available ZRNOs. This threshold is determined by the accounting mechanics: at a coefficient of 1, inscribing one ZRNO requires at least 1 POEN, at which point the accounting relationship between the two units begins to function meaningfully. This is the trigger for activating ZRNO inscription — the Protocol begins accepting ZRNO inscription requests according to the rules described in chapter 6.

With the activation of ZRNO, the Upper Kolo automatically comes into being — the system's governing body comprises the Kolo keepers who have activated ZRNO. Governance powers transfer from the Foundation's Board of Directors to the Kolo keepers who have activated ZRNO (chapter 10). There is no separate step for activating the Upper Kolo: one million POENs is the threshold that simultaneously activates ZRNO, establishes the Upper Kolo, and marks the transition from founding governance to community governance. The Foundation retains its legal and service role, as well as a protective veto over decisions of the Upper Kolo. The veto expires permanently and irreversibly when the Foundation's financial resources reach the financial self-sufficiency threshold established by a special rulebook.

The first Kolo members reach the threshold of twenty thousand POENs and begin to inscribe ZRNO. The accounting coefficient changes for the first time on the basis of real activity. Alongside the founders, the system also acquires its first Kolo keepers who have obtained that status by the regular path. The founders, who had a supervisory function in Phase 1, are Kolo keepers from the establishment of the system under the transitional provision of the Rulebook, so the supervisory function is tied from the outset to the status of Kolo keeper in accordance with the Rulebook on Proof of Reality.

Threshold for transition to the modular phase: a sufficient number of Kolo keepers, a sufficient volume of activity, stability of the foundation over a defined period. Specific thresholds are defined in the KOLO Rulebook or special rulebooks and are published publicly before the start of Phase 1, so that their fulfillment becomes verifiable by every user.

## Modular Phase

The modular phase begins when the foundation of the system — the common good, the Protocol, the Foundation, the community, POEN, ZRNO, proof of reality, financial and operational contribution — functions stably and when there is a sufficient number of Kolo keepers for the governance mechanisms to be activated.

In this phase, modules are activated according to their own prerequisites, not in a predetermined order. Which module is activated first depends on the needs of the community and the decision of the Upper Kolo, which is already active in this phase. Modules are described in chapter 9; they are listed here with their activation prerequisites.

Circles are activated when there are enough users for interest-based association to make sense — the minimum number of users and rules of formation are defined in the system rulebook.

Cooperatives have been activated by the Rulebook on Cooperatives (set 4.7.0). A Cooperative enters the system when the local community has a need for its own organizational unit registered under the Law on Cooperatives, when at least five cooperative members are participants, and when a cooperation agreement has been concluded. The first Cooperative in a locality opens only when that place has at least fifty participants, and the Foundation participates in its establishment; each subsequent Cooperative in the same place is established on the initiative of users, with at least five cooperative members. The Foundation assists in its establishment and coordinates integration into the system.

Social Programs are activated when the system has enough users for automatic recording for qualifying groups to make sense within the accounting framework.

The Children module is activated when all protective measures for minor users have been established — consent of a parent or legal guardian, activity restrictions, enhanced data protection (chapter 12).

Internationalization is activated when the system is stable with an active Upper Kolo, when there is sufficient experience with operation in the core region, and when a legal analysis for the target jurisdictions has been conducted. Expansion to the territory of the European Union requires, in addition to full compliance with GDPR, an assessment of the impact of data transfers before commencing processing of user data in the new jurisdiction.

The modular phase has no end. The system continues to develop — new modules, new rules, new users — under the governance of the community, not the founder. The transition from Phase 1 to Phase 2 — the activation of ZRNO and the emergence of the Upper Kolo — is the end of the founding period, not the end of development.

## Open Questions

The system recognizes questions to which it currently has no final answer. These questions are listed here because honesty toward users and regulators is more important than the appearance of completeness.

Inheritance. The system's position is that POENs and ZRNO have no proprietary character and cannot be inherited as property — POEN has no holder and cannot be converted into money, and ZRNO is non-transferable and tied to the identity of a natural person established in the chain of confirmations. Upon learning of a user's death, free ZRNO is returned to the pool of available ZRNOs in the Protocol without POEN records, active ZRNO is deactivated and returned to the pool, and identification data is deleted according to the procedure in chapter 12 — records in the contribution ledger remain under an identifier that no longer permits identification. This position could be challenged given that the records have intra-systemic use value; the final resolution may depend on the development of case law on the status of digital records in inheritance law.

Regional federation. The internationalization module (chapter 9) envisages expansion of the system with a unified ledger — not a federation of independent systems. However, communities in other cities or countries may wish to launch their own system with a separate ledger but compatible rules. The question of whether such systems could be federated — sharing rules but maintaining separate ledgers — and whether POENs in one system would have effect in another is not addressed by the current design. This question becomes relevant only when the system reaches a scale that demands it and differs from internationalization, which retains a single Protocol.

Scaling of proof of reality. The proof of reality model — the chain of confirmations based on personal acquaintance or on a conversation after a call (chapter 7) — addresses the scaling of verification in a decentralized manner: every Kolo member can confirm users, subject to a limited daily pace of confirming, and Kolo keepers oversee expansion and ensure the integrity of the verification graph. However, open questions remain. One confirmation makes it easier for the network to expand, but each verifier thereby becomes the sole support for those they have introduced. The call list opens a path for those who know no one, but a conversation after a call is a weaker support than personal acquaintance; that is why someone introduced into the Kolo after a conversation remains a member without confirmation, with limited actions, until confirmed by someone who knows them personally. The risk of coordinated false confirmations grows with the size of the system and with the decrease in the density of social ties (cf. Douceur, 2002, on Sybil attacks in distributed systems). The question of how to ensure the integrity of the verification graph with hundreds of thousands of users — especially in the context of geographic expansion beyond the region where a dense acquaintance network exists — remains open and depends on experience from earlier phases and possible technical upgrades to the model.

Relationship with the tax system. The exchange of goods and services within the KOLO system may have tax implications for users. If a user exchanges a service with another user, is that exchange subject to income tax? To VAT? The system's current position is that POENs are records without proprietary value, but tax authorities may take a different view — especially if exchange within the system qualifies as barter within the meaning of tax regulations. This question requires legal analysis and potentially consultation with tax authorities. The experience of complementary systems in other jurisdictions — from the Chiemgauer in Germany to the WIR in Switzerland — shows that tax treatment varies significantly and that it is not possible to assume the outcome without formal analysis.

Limits of growth. Is there a point beyond which the system ceases to function as designed? Does one million ZRNOs become a limiting factor with one million users? Does the accounting coefficient become unworkably high with tens of millions of recorded POENs? The accounting formula does not set an upper limit, but practice may reveal operational constraints that theory does not anticipate.

## Structural Limits of the System

Throughout the entire development trajectory, the system actively maintains boundaries that it does not cross — structural elements without which the system ceases to be a participatory common-good system.

The four principles from chapter 4 — non-convertibility, the absence of proprietary rights over records, the non-refundability of donations, and data minimization — are structural limits that cannot be abolished by any governance decision. Alongside them, the common-good licenses (AGPL-3.0 for software and CC BY-SA 4.0 for content, chapter 3) cannot be replaced by more restrictive ones. Crossing any of these boundaries changes the legal nature of the system — from a participatory common-good system to a financial instrument, payment service, investment scheme, or surveillance instrument, with all the regulatory consequences that entails. Such a transformation is irreversible — which is why the boundaries are set as structural elements of the architecture, not as parameters subject to governance change.

These limits are not restrictions imposed on the system from the outside. They are constitutive elements that make the system what it is — abolishing them would not be a change to the system but the end of its existence in its current form. The distinction between structural limits and operational parameters of the system — which can and should be changed with experience — is explained in chapter 4.

# 14. Conclusion

This document describes the architecture, legal position, accounting framework, organizational structure, modules, governance mechanisms, incentive structure, data protection, and development trajectory of the KOLO system — a participatory common-good system based on contribution records.

The system integrates elements that existing models address only partially: contribution records through a Protocol and two accounting units (chapter 6), proof of reality based on personal acquaintance or on a conversation after a call rather than the collection of personal documents (chapter 7), progressive decentralization of governance with measurable transition conditions (chapter 10), a legal framework through the Foundation as an instrument that gives the system a recognizable form in legal dealings without owning it (chapter 5), and a modular architecture that separates the foundation from extensions (chapter 9).

The four principles — non-convertibility of POEN, the absence of proprietary rights over records, the non-refundability of donations, and data minimization — constitute the structural limits of the system (chapter 4). These principles are not operational parameters subject to governance change but constitutive elements without which the system ceases to be what it is. Their function is twofold: they ensure that the system cannot evolve into a financial instrument, payment service, or investment scheme, and they simultaneously lay the groundwork for the legal qualification of the system as a participatory common-good system.

The system recognizes its limitations. The tension between accumulation and circulation is a deliberate design choice with documented consequences (chapter 11). The scaling of proof of reality beyond a region with a dense acquaintance network remains an open question (chapter 13). The relationship with the tax system — specifically the question of whether exchange within the system is subject to qualification as barter — requires formal analysis and consultation with the competent authorities (chapter 13). The question of the inheritance of records has no final answer. These open questions are stated in the document because honesty toward users and regulators is part of the system's design, not a deficiency in its documentation.

The KOLO system commences operation with the publication of this document. The documentation that follows — Appendix A (international institutional framework), Appendix B (parameter tables), Appendix C (glossary), Appendix D (technical and organizational security measures), and Appendix E (mapping of Ostrom design principles) — provides additional context for positioning the system within the regulatory and academic framework.

# Appendix A: International Institutional Framework

The KOLO system fits functionally within the broader institutional context that international organizations are actively developing for the social and solidarity economy. This appendix summarizes the key documents of that framework. The documents have no direct legal force within the Serbian legal system, but they constitute the institutional framework defining the direction of regulatory development — relevant for Serbia in the process of EU accession.

### European Commission Action Plan for the Social Economy (COM(2021) 778, December 2021)

A strategic document providing for measures over the period 2021–2030 in three areas: legal frameworks, financing, and visibility of the social economy. The Commission recognizes foundations, cooperatives, and associations as key actors in the social economy and provides for measures to adapt legal frameworks, tax policies, and public procurement systems. Relevant to KOLO because it confirms that the EU is actively building regulatory space for the type of entity in which KOLO functionally fits.

### Council of the EU Recommendation on Developing Framework Conditions for the Social Economy (C/2023/1344, 27 November 2023)

Calls on member states to adapt legal frameworks, tax policies, public procurement, and administrative structures to the needs of the social economy. Member states are invited to adopt or update national strategies for the social economy. It is relevant to Serbia because the EU accession process entails alignment with the acquis communautaire, including recommendations in the area of the social economy.

### ILO Resolution on Decent Work and the Social and Solidarity Economy (ILC.110/Resolution II, June 2022)

The first formal recognition of the social and solidarity economy within the UN system. It defined the sector and established guidelines for support by ILO member states. Serbia is a member of the ILO. The resolution defines social and solidarity economy entities through the principles of voluntary cooperation, democratic governance, and the primacy of social purpose over capital — principles that are structurally embedded in the KOLO system.

### OECD Recommendation on the Social and Solidarity Economy and Social Innovation (OECD/LEGAL/0472, June 2022)

A recommendation of the OECD Council calling on member states to develop legal frameworks, tax incentives, and institutional support for the social and solidarity economy. It emphasizes the need for adapted regulatory frameworks that recognize the specific characteristics of social economy entities — including contribution ledger systems, participatory governance, and non-profit organization.

### UN General Assembly Resolution A/RES/77/281 (18 April 2023)

The first UN General Assembly resolution dedicated to the social and solidarity economy. It defines the social and solidarity economy as entities based on principles of voluntary cooperation, mutual aid, democratic governance, and the primacy of people and social purpose over capital. It calls on member states to develop legal frameworks, fiscal incentives, and support programmes.

### UN General Assembly Resolution A/RES/79/213 (December 2024)

A continuation and expansion of A/RES/77/281. It confirms the role of the social and solidarity economy in achieving sustainable development goals and calls for more concrete institutional support at the national level.

### UN Inter-Agency Task Force on Social and Solidarity Economy (UNTFSSE)

An inter-agency team that coordinates support for the social and solidarity economy within the UN system. The EU Action Plan explicitly lists cooperation with UNTFSSE as a priority. UNTFSSE publishes annual reports on the state of the sector and provides technical support to member states in developing regulatory frameworks.

### Relevance for the KOLO System

All of the documents cited recognize and support the type of entity in which KOLO functionally fits: participatory systems based on the common good, with democratic governance, non-profit organization, and contribution ledgers as the central mechanism. For Serbia in the EU accession process, this framework defines the direction of regulatory development the country is entering. The KOLO system was not designed to fit this framework retroactively — the principles embedded in it (chapters 2 and 4) align with the principles these documents formalize because they share common intellectual roots in the cooperative and neo-mutualist tradition.

### Serbian Legal Map

Relevant Serbian regulations — the Law on Digital Assets, the Law on Payment Services, the Law on Capital Markets, the Law on Endowments and Foundations, the Law on Personal Data Protection, the Law on Cooperatives, the Law on Prevention of Money Laundering and Terrorism Financing, the Law on Labour, the Law on Obligations, and tax regulations — are analyzed in the context of each element of the system in chapters 4, 6, 7, 8, 9, 10, and 12. The legal position of the system in relation to each of these regulations is presented where it is more relevant to understanding the specific element of the system than in an isolated appendix.

# Appendix B: Parameter Tables

The tables in this appendix summarize the key parameters of the system. Each parameter is explained in detail in the chapters referenced by the tables. Parameter values are subject to change through the governance processes described in chapter 10, except for the structural limits set out in chapter 4, which cannot be changed by any governance decision.

### Table 1: POEN Parameters (chapter 6.1)

| **Parameter** | **Value** | **Note** |
| --- | --- | --- |
| Legal character | Contribution ledger entry | Not money, currency, token, payment instrument, electronic money, or digital asset |
| Holder | Does not exist | POEN exists exclusively as a record in the Protocol ledger |
| Recording | Exclusively through the Protocol | Based on activities and rules defined in the Protocol |
| Recording categories | Basis (POEN in user's record): donations, sponsorship, verification, operational contribution. Modules: growth of Circles and Cooperatives (POEN in the record of the organizational unit), social programmes (automatic recording by status) | Exchange does not increase the total number of POENs — it redistributes existing ones (zero-sum) |
| Convertibility | Non-convertible | Structural limit (chapter 4) |
| User's property right | Does not exist | Structural limit (chapter 4) |
| Use outside the system | Not possible | POEN has no external asset value |

### Table 2: ZRNO Parameters (chapter 6.2)

| **Parameter** | **Value** | **Note** |
| --- | --- | --- |
| Legal character | Position ledger entry | Not a security, share, stock, investment contract, or digital asset |
| Total available | 1,000,000 | Fixed in the Protocol |
| Transferability | Non-transferable | Never, at any stage, in any way |
| States | Free or active | Free: enables redemption; active: enables voting |
| Minimum POEN for inscription | 20,000 | Recorded in the system |
| Maximum inscription per period | 1% of balance | Per accounting period |
| Redemption | At the accounting coefficient | In the new accounting period, only for free ZRNO |
| Trading | Not possible | No market or transfer mechanism exists |
| Dividend/interest/return | Does not exist | Nor is any benefit guaranteed |

### Table 3: Accounting Coefficient (chapter 6.3)

| **Parameter** | **Value** | **Note** |
| --- | --- | --- |
| Formula | Total number of POENs ÷ number of ZRNOs available | Both elements are variable |
| Character | Administrative figure | Not a price, exchange rate, or performance index |
| Calculation frequency | Once daily | At the end of the accounting period |
| Who calculates | Protocol | Automatically, without discretion |
| Who controls | No one individually | Consequence of total activity |
| Minimum value for ZRNO activation | 1 | Reached at 1,000,000 recorded POENs |

### Table 4: User Statuses (chapter 7)

| **Status** | **Description** | **Access** |
| --- | --- | --- |
| User | Adult user who is not in the Kolo | System overview, listings and exchange, conversation to the extent set out in the Terms of Use, participation in POEN ledger updates (as giver/receiver), requesting a conversation and the call list |
| Member without confirmation | Introduced into the Kolo, not yet confirmed | Exchange, contribution recording, donating, programmes, procurements, Cooperatives, inscription and redemption of ZRNO, introducing acquaintances into the Kolo; without confirming, activating ZRNO or a vote |
| Kolo member | One valid confirmation in the chain of confirmations | Exchange, contribution recording, donating, confirming users, introduction into the Kolo from the call list, Circles and Cooperatives |
| Kolo keeper | Kolo member with inscribed ZRNO | All Kolo member functions + governance + position in the accounting system |

### Table 5: Governance Phases (chapter 10)

| **Phase** | **Governance holder** | **Transition threshold** |
| --- | --- | --- |
| Founding phase | Founder | Foundation registered, Protocol developed, infrastructure established |
| Phase 1 | Founder and Foundation | Foundation registered, Protocol operational |
| Phase 2 | Upper Kolo (Kolo keepers who have activated ZRNO) | 1,000,000 POENs recorded — activates ZRNO and Upper Kolo |

| **Protective mechanism** | **Condition** | **Note** |
| --- | --- | --- |
| Foundation's protective veto | Active until dissolution | Rejects a decision that jeopardizes the operational and financial sustainability of the Foundation until financial self-sufficiency |
| Veto dissolution | Financial self-sufficiency threshold established by a specific bylaw | Permanent and one-way |

### Table 6: Modules (chapter 9)

| **Module** | **Name** | **Activation prerequisites** |
| --- | --- | --- |
| 1 | Circles | Sufficient users for interest-based association |
| 2 | Cooperatives | Activated by the Rulebook on Cooperatives (set 4.7.0); local need, registration under the Law on Cooperatives, and a cooperation agreement |
| 3 | Social Programs | Sufficient users for meaningful automatic recording |
| 4 | Children | All protective measures for minor users |
| 5 | Internationalization | Stable system with active Upper Kolo, legal analysis |

*Verification (chapter 7), donations by natural persons and sponsorship by legal entities (chapter 8.2), and operational contribution (chapter 8.3) are part of the core system that functions from day one — not modules that are activated according to prerequisites.*

# Appendix C: Glossary

Terms are grouped thematically for ease of reference. Each definition is consistent with the definition in the chapter it references.

### System Structure

**Common good —** The center of the KOLO system. The collective good of all users, encompassing software, rules, the ledger, and content. The infrastructure on which these elements exist is not a constituent part of the common good in the same sense, but is an operational prerequisite whose maintenance is a service obligation of the Foundation. No individual, including the founder, holds an individual property right over the common good or any part thereof. It does not constitute collective property within the meaning of the applicable property-law categories of Serbian law. Protected by the AGPL-3.0 (software) and CC BY-SA 4.0 (content) licenses. Chapter 3.

**Protocol —** The technical mechanism of the common good. The software that maintains the ledger, calculates relationships, and applies the rules. Has no legal personality. Does not make decisions — it executes rules set by people. Chapter 3.

**Foundation (KOLO Foundation) —** The legal instrument of the system. Registered in Sombor under the Law on Endowments and Foundations. Holds the infrastructure, receives monetary donations, and represents the system in legal dealings. Safeguards the common good, but is not its owner. Data controller within the meaning of the LPDP. Chapter 5.

**Community (KOLO Community) —** All users in the system, who together take care of the common good. Uses the system, contributes to it and finances the Foundation through monetary donations; participates in governance through the Upper Kolo. It is not a legal entity and does not make decisions as a whole. The community's relationship to the common good is participatory: the right to use and contribute, not the right to dispose. Chapter 5.

**Core —** The minimal set of elements without which the system does not exist. Encompasses: the common good, the Protocol, the Foundation, the community, POEN, ZRNO, the accounting coefficient, proof of reality, financial contribution, and operational contribution. Operational from day one. Chapters 3–8.

**Module —** An extension that adds functionality to the core without changing it. Each module uses the same Protocol, the same ledger, and the same rules. Activated according to its own prerequisites. Chapter 9.

### Accounting Framework

**POEN —** The internal accounting unit of the system. A ledger entry for contributions and other forms of participation in the common good. Has no holder — it exists exclusively as a record in the Protocol ledger. Records are entered solely by the Protocol. Recording mechanisms: user contributions (donations, sponsorship, verification, operational contribution) — POENs in the user's record; growth of Circles and Cooperatives (Modules 1 and 2) — POENs in the record of the organizational unit; automatic recording in social programmes (Module 3) — POENs in the support recipient's record by status. Exchange does not increase the total number of POENs — it redistributes existing ones (zero-sum). Not money, currency, token, payment instrument, electronic money, or digital asset. Non-convertible. Chapter 6.1.

**ZRNO —** A record of position in the common good. Total available: one million. Inscribed only by a participant — a Kolo member, or a member without confirmation who does not activate it until confirmed; inscribed and redeemed exclusively through the Protocol. Non-transferable between users. Can be in a free state (enables redemption) or an active state (enables voting in the Upper Kolo). Not a security, share, stock, investment contract, or digital asset. Carries no dividend, interest, or guaranteed return. Chapter 6.2.

**Accounting coefficient —** The total number of POENs recorded in the system divided by the number of ZRNOs available in the Protocol. Calculated by the Protocol once daily. An administrative figure — not a price, exchange rate, or performance index. Chapter 6.3.

**Accounting period —** The time interval at the end of which the Protocol calculates the accounting coefficient and applies the rules for ZRNO inscription and redemption. The accounting period lasts 24 hours, closing at midnight — a fixed element of the system. Chapter 6.

**Two separate acts —** The principle that the legal act of donation (monetary flow) and the administrative act of POEN recording (accounting flow) are two legally independent acts. A donation does not purchase POENs. Recording is not a counter-performance for the donation. Chapter 4.

### Users

**User —** Any person with an account on the platform, regardless of status; a user of a service within the meaning of the regulations. An adult user has one of four statuses — user, member without confirmation, Kolo member, or Kolo keeper; a minor user has no status, and their position is governed by the Rulebook on the Participation of Children. Chapter 7.

**User (status) —** An adult user who is not in the Kolo. Can view the system, post listings and exchange goods and services, converse with other users to the extent set out in the Terms of Use, and participate in POEN ledger updates (as giver or receiver). A contribution is recorded for them only through contribution to platform content, financial contribution and sponsorship. Has no access to governance, confirming others, or support programmes, and does not inscribe ZRNO. May get onto the call list. Entry-level status. Chapter 7.

**Kolo member —** A user whose reality has been confirmed in the chain of confirmations, by one valid confirmation. Exchanges, contributes, acquires POEN records, donates, confirms the reality of users whom they know personally and introduces users from the call list into the Kolo, participates in Circles and Cooperatives. Full and legitimate status. Chapter 7.

**Member without confirmation —** An adult user whom someone has introduced into the Kolo but who has not yet been confirmed by a Kolo member who knows them personally. Belongs to the Kolo; belonging to the Kolo is not membership in the Foundation. Has the rights of a participant, but not the rights that the acts attach to a Kolo member: confirms no one, but only introduces acquaintances into the Kolo; is confirmed by a Kolo member who knows them personally, by a Kolo keeper after a telephone conversation or by the Foundation; does not see the call list, does not give a recommendation and does not supervise; inscribes ZRNO but does not activate it. Chapter 7.

**Kolo keeper —** A Kolo member to whom ZRNO is inscribed in the Protocol. All functions of a Kolo member plus participation in governance through the Upper Kolo by activating ZRNO, a position in the accounting system, and the function of an expansion supervisor. One whose verification lapses becomes a user, and their ZRNO remains inscribed and frozen until they are confirmed again; one whose confirmation alone is annulled becomes a member without confirmation. Chapter 7.

**Founders —** The initial Kolo keepers, established by the transitional provision of the Rulebook. The origin of the chain of confirmations; their confirmed status does not arise from verification. Chapter 7.

**Kolo —** The circle of participants — members without confirmation, Kolo members, and Kolo keepers. It is not a legal entity; belonging to the Kolo is not membership in the Foundation or in any other legal entity. Chapter 7.

### Proof of Reality

**Proof of reality —** A user verification model based on personal acquaintance or on a conversation after a call. It confirms reality (the user exists as a natural person) and continuity (the same person who was originally verified); the verifier does not guarantee uniqueness, and a multiple account is established by the Foundation. Does not require the collection of personal documents. Chapter 7.

**Chain of confirmations —** The proof-of-reality mechanism in which Kolo members confirm the reality of users whom they know personally or, after a conversation, introduce them into the Kolo, while members without confirmation introduce acquaintances into the Kolo. The only way of confirming reality; the only exception are the founders. Chapter 7.

**Participant —** A user for whom one valid verification has been recorded in the chain of confirmations, by confirmation or by introduction into the Kolo: a member without confirmation, a Kolo member, and a Kolo keeper. Belonging to the Kolo has no degrees and determines access to system functions. Chapter 7.

**Confirmation status —** The property of a Kolo member: a user whose reality has been confirmed by a confirmation, or a member without confirmation once confirmed, and the founders. Determines the right to confirm, to activate ZRNO, and the other rights that the acts attach to a Kolo member. Chapter 7.

**Confirmation and introduction into the Kolo —** Two kinds of verification. Confirmation is given by a Kolo member, or a founder, to a person they know personally, and the confirmed person becomes a Kolo member; by introduction into the Kolo, a Kolo member after a conversation introduces a user from the call list, or a member without confirmation introduces an acquaintance, and the introduced person becomes a member without confirmation. The difference is not a degree of belonging to the Kolo. Chapter 7.

**Call list —** A list of users who know no Kolo member and are waiting for a call in order to get acquainted. One gets onto it by requesting a conversation, by a public donation of at least 5,000 dinars made in a single payment, by a sponsorship in money, or by registering a farm entered in the Register of Agricultural Holdings. Getting onto the list does not confirm reality. Chapter 7.

**Bootstrap mechanism —** The mechanism for starting the chain of confirmations, whereby the founders are confirmed without verification by other users. Chapter 7.

**Expansion supervisor —** The function of subsequently checking the legitimacy of a completed verification. It is performed by Kolo keepers, including the founders; it arises from status and does not depend on the phase of the system. Chapter 7.

### Contribution

**Financial contribution —** Monetary inflow to the Foundation. Encompasses donations by natural persons and sponsorship by legal entities, entrepreneurs and agricultural holdings. Chapter 8.2.

**Operational contribution —** An activity outside the platform whose contribution is recorded in POENs following verification of performance. Not an employment relationship within the meaning of Article 5 of the Law on Labour. Chapter 8.3.

**Sponsorship —** A donation of money by a legal entity, an entrepreneur or a holder of a registered agricultural holding, or sponsorship in goods and services. The contribution is recorded in the record of the user who submitted the application, under the same table as a donation by a natural person. The only point in the system where the external economy directly influences the internal ledger. Chapter 8.2.

**Donation recording coefficient —** The ratio between the amount of a monetary donation and the number of POENs recorded for the donor. A parameter that can be changed by a governance decision. It is not the accounting coefficient (which is the total number of POENs divided by the number of available ZRNOs). Chapter 8.2.

**Farm —** A household that produces food or agricultural products and offers them on the Pijaca, whether or not entered in the Register of Agricultural Holdings. It is not a user in the system or a collective form and has no record in the protocol; the members of an approved farm have their contribution recorded in their personal records, and when the farm terminates — on any ground — it is written off from all its members at the moment of termination, even where the record thereby becomes negative; in the case of a false statement, the write-off and exclusion also affect persons who were members during the period to which the statement relates, even if they have since left. All members of the farm who are Kolo members manage it equally on the platform, and the holder, or the applicant in the case of a farm outside the register, is responsible for the statement on the accuracy of the data. It is displayed on the public map of local producers. Rulebook on Farms.

### Governance

**Upper Kolo —** The governing body of the system. Composed of the Kolo keepers who have activated ZRNO; its composition and voting power are determined for each accounting period and apply only during it. Comes into existence automatically with ZRNO activation at the threshold of 1,000,000 POENs. Decides by quadratic voting with the possibility of delegation. Limited by the four principles of the system, the Foundation's protective veto, and the licenses. Chapter 10.

**Progressive decentralization —** A structured pathway from centralized to decentralized governance. Two phases with a measurable transition threshold (1,000,000 POENs). Chapter 10.

**Quadratic voting —** The decision-making mechanism in the Upper Kolo. Voting power equals the integer value of the square root of the number of active ZRNOs, rounded down. Chapter 10.

**Delegation —** The transfer of voting power from one Kolo keeper to another. Votes are delegated, not ZRNO. General — the delegate votes on all issues. Revocable. Delegated votes are added to the delegate's own votes. The rules of delegation, including the effects of revocation and delegation limits, are established by the Bylaw on the Upper Kolo. Chapter 10.

**Protective veto —** The Foundation's right to reject a decision that jeopardizes the operational and financial sustainability of the Foundation before it achieves financial self-sufficiency. Must be reasoned. Dissolves permanently and one-way when the Foundation's financial resources reach the financial self-sufficiency threshold established by a specific bylaw. Chapter 10.

### Modules

**Circle —** An organizational unit based on shared interest or activity. Has no legal personality. Chapter 9, Module 1.

**Cooperative —** A local organizational unit based on a territorial principle. Registered under the Law on Cooperatives and has full legal personality. Two functions: local coordination and the distribution of goods in the locality, and incentive (growth mechanism). Does not confirm the reality of users. Participation is governed by the Rulebook on Cooperatives. Chapter 9, Module 2.

**Social programmes —** A mechanism for automatic POEN recording for qualified groups of users whose structural participation in the common good the Protocol recognizes even though it is not expressed through individual activities. Initial groups: parents, older users, persons with disabilities, pupils and students. Chapter 9, Module 3.

**Growth of Circles and Cooperatives —** A POEN recording mechanism activated with Modules 1 (Circles) and 2 (Cooperatives). The Protocol enters new POEN records in proportion to the number of members of the organizational unit and the reaching of defined thresholds. POENs are recorded in the record of the Circle or Cooperative as an organizational unit, not in the records of individual members. Not a user contribution in the sense of the other categories. Chapter 9.

### Structural Principles

**Non-convertibility —** A structural principle of the system. No accounting unit can be converted into money or into any instrument with external value. Cannot be abolished by any governance decision. Chapter 4.

**Absence of property rights over records —** A structural principle of the system. A user has no property right over the record of their contribution. Records are data in the ledger, not assets. Cannot be abolished by any governance decision. Chapter 4.

**Non-refundability of donations —** A structural principle of the system. A monetary donation to the Foundation is non-refundable. The donor does not acquire the right to a refund, a governance right, or a share in the system. Cannot be abolished by any governance decision. Chapter 4.

**Data minimization —** A structural principle of the system. The platform collects only the data necessary for the operation of the system. The Foundation does not store personal data of platform users in its own databases. Cannot be abolished by any governance decision. Chapter 4.

# Appendix D: Technical and Organizational Security Measures

This appendix describes the technical and organizational measures that the Foundation applies to the infrastructure on which data resides, in accordance with the obligation to implement measures appropriate to the risk (Article 51 LPDP; GDPR Article 32). The measures apply to all categories of data described in chapter 12, with enhanced measures for special categories of data and data of minors. Concrete implementation is adapted to the current state of the infrastructure and updated as the system develops.

### Pseudonymization and Data Separation

Records in the Protocol ledger are linked to pseudonyms, not to users' personal names. The first and last name is kept only in the identity register, a separate record visible only to the Foundation's administrator team; the first and last name of a user from the call list is also seen by the Kolo member who calls them, while the call is open; the unique citizen identification number and data from identity documents are not entered in it. Pseudonymized data remains personal data within the meaning of the LPDP (Article 4, paragraph 1, item 3a), because — with additional information — it can be linked to an identified person.

The Foundation does not store personal data of platform users — all user data is stored on the Protocol infrastructure. The Foundation directly stores only the banking documentation of donations and the record of the link between the sponsoring legal entity and the user in whose record the contribution is entered. This separation is a design decision described in chapter 12.

### Encryption

Data in transit is protected by TLS encryption, minimum version 1.2. Communication between users and the system, between system components, and between the system and external services takes place exclusively over encrypted channels.

Data at rest is protected by storage-level encryption. Users' identification data (pseudonym, email address), donation data, sponsorship data, and special categories of data are encrypted before storage. Encryption keys are stored separately from the encrypted data, with controlled access to the keys.

### Access Control

Access to data is based on the principle of minimum necessary access (Article 51, paragraph 2 LPDP) — each system user, each administrator, and each process has access only to the data necessary for the performance of their function.

Administrative access to infrastructure requires multi-factor authentication. Access to users' identification data is limited to authorized persons in the Foundation. Access to the Protocol ledger is automated — the Protocol accesses data according to rules, without manual intervention.

System users access their own data and the pseudonymous ledger of other users, to the extent corresponding to their status. Users cannot access the identification data of other users unless those users explicitly choose to be visible. The exception is the first and last name and telephone number of a user from the call list: they are opened only to the Kolo member who opened the call and only while the call is open, and it is recorded who opened them.

Access to special categories of data (health condition, disability, parental status, student status) is limited to the status verification process and is not retained after verification — the system retains only the minimal record of group membership and the date of verification.

### Access Logging

Every access to data is recorded — who accessed it, when they accessed it, what data they accessed, and from which device. The access log is kept in a protected format that cannot be retroactively altered. The access log is available to the Data Protection Officer (DPO, Article 56 LPDP) and is used to detect unauthorized access.

### Ledger Integrity

The contribution ledger in the Protocol is protected from unauthorized modification. Each record in the ledger is timestamped and linked to the previous state of the ledger. Retroactive modification of records is not possible without compromising the integrity of the entire ledger chain. This is a design rule ensured by the software architecture of the centralized ledger, not a property of distributed infrastructure. Regular consistency checks ensure that the ledger at all times conforms to the Protocol rules.

### Protection of Special Categories of Data

Special categories of data arise through the activation of Module 3 (Social Programs) and Module 4 (Children). The processing of such data is subject to enhanced requirements (Article 17 LPDP; GDPR Article 9).

The Foundation does not store copies of submitted documentation — the system retains only the minimal record of membership in a qualifying group and the date of status verification. Access to this data is limited to the verification process. The data is stored separately from the general activity ledger and is protected by an additional level of encryption.

Data of minors (Module 4) is subject to enhanced protection in accordance with Article 16 LPDP. The consent of a parent or legal guardian is recorded and stored separately. Both modules were activated only after the data protection impact assessment (DPIA) was updated.

### Data Protection Impact Assessment (DPIA)

The Foundation conducts a data protection impact assessment prior to the commencement of processing (Article 54 LPDP; GDPR Article 35). The DPIA is updated before activating each module that introduces the processing of new categories of data; Module 3 (special categories) and Module 4 (minors) were activated in this way. The results of the DPIA are available to the DPO and serve as the basis for applying appropriate protective measures.

### Backup and Recovery

Data is regularly backed up to geographically separate locations. The backup includes the Protocol ledger, identification data, and system configuration. Recovery procedures are regularly tested to ensure that the system can resume operation after data loss, infrastructure failure, or a security incident.

Backup data is subject to the same protective measures as primary data — encryption, access control, access logging.

### Cross-Border Data Transfers

If the system infrastructure includes servers outside the Republic of Serbia, the transfer of personal data out of the country is subject to the LPDP rules on cross-border transfer (Articles 65–69). The Foundation ensures that data transfers to third countries are based on an adequate level of protection — by way of an adequacy decision, appropriate safeguards, or derogations provided for by law. The choice of cloud provider takes into account the server location and the applicable legal framework for data protection in the jurisdiction where the servers are located.

### Incident Management

The Foundation has a defined procedure for managing security incidents. The procedure includes: incident detection, severity assessment, damage containment, root-cause remediation, notification of affected users, and notification of the Commissioner for Information of Public Importance and Personal Data Protection within 72 hours of becoming aware of the incident (Article 52 LPDP; GDPR Article 33).

Each incident is documented with a description of the cause, affected data, measures taken, and lessons learned for preventing future incidents. If an incident is likely to result in a high risk to the rights and freedoms of users, the Foundation notifies affected users without undue delay (Article 53 LPDP; GDPR Article 34).

### Regular Testing

Security measures are regularly tested. Testing includes vulnerability assessments of infrastructure, penetration testing of the system, compliance checks against security policies, and incident simulations. Test results are documented and used to improve measures.

### Physical Security

The system infrastructure — servers, network equipment, backup media — is located in secured premises with controlled access. If the Foundation uses cloud infrastructure, it selects providers that have certified physical security measures (ISO 27001 or equivalent) and contractually regulates the provider's security obligations, including obligations under a data processing agreement (Article 45 LPDP).

### Organizational Measures

Persons with access to user data sign a confidentiality obligation. Regular training of Foundation employees and associates on data protection and information security. Clear division of responsibilities in the security domain. The Data Protection Officer (DPO) has independence and access to all information on data processing and security (Article 58 LPDP). If the Foundation engages third parties for infrastructure maintenance, those parties are data processors within the meaning of the LPDP (Article 45), and the relationship is governed by a data processing agreement.

### Software Development

The Protocol software is developed according to the principles of secure development and privacy by design (Article 50 LPDP; GDPR Article 25). Code is reviewed before being released to production. Known vulnerabilities are tracked and remediated within defined timeframes. System updates are applied in a planned manner, with testing in a controlled environment before deployment to the production system. The source code is available under the AGPL-3.0 license, enabling independent security audits by the community and third parties.

# Appendix E: Mapping of Ostrom Design Principles onto KOLO Architecture

Elinor Ostrom, based on empirical research into communities that successfully govern common-pool resources, formalized eight design principles for the long-term sustainability of collective governance institutions (Ostrom, 1990). These principles were originally formulated for rival common goods — pastures, fisheries, water resources — where use by one reduces availability for others. The KOLO system is a non-rival digital common good (cf. Hess and Ostrom, 2007) — software, rules, and infrastructure whose use by one user does not diminish availability for others, with a positive network effect that increases utility as the number of users grows. This distinction is important because some principles take a different form in the context of a non-rival good.

This appendix maps each of the eight principles onto specific elements of the KOLO architecture.

### Principle 1: Clearly Defined Boundaries

*Ostrom:* The boundaries of the common good and the circle of users who have the right of access must be clearly defined.

*KOLO:* The system distinguishes four statuses of adult users with explicitly defined access rights for each status. A user has access to a system overview, exchange, and participation in POEN ledger updates. A member without confirmation, introduced into the Kolo, has the rights of a participant, but does not confirm others and does not vote. A Kolo member (confirmed by one valid confirmation) has full access to exchange and contribution recording. A Kolo keeper has additional governance rights and a position in the accounting system. The transition between statuses is defined by the rules of the system — by verification and confirmation in the chain of confirmations, and by the inscription of ZRNO under measurable conditions. Proof of reality through the chain of confirmations (chapter 7) ensures that behind every participant stands a real, unique person. The boundaries of the common good are defined by the licenses (AGPL-3.0 and CC BY-SA 4.0, chapter 3) and by the four structural principles (chapter 4).

*Alignment:* Structural. The boundaries are clearer than in most Ostrom examples because they are embedded in software, not in social conventions.

### Principle 2: Congruence Between Appropriation and Provision Rules and Local Conditions

*Ostrom:* The rules on use and contribution must be adapted to local conditions.

*KOLO:* The Protocol rules are set by people, not an algorithm. In Phase 1, the founder and the Foundation adapt parameters based on operational experience. In Phase 2, the Upper Kolo changes rules by quadratic voting. Parameters are operational and subject to change — only the structural limits (chapter 4) are above governance authority. The modular architecture (chapter 9) enables adaptation — modules are activated according to community needs. Cooperatives (Module 2) as local organizational units enable distribution in the locality to be organized under the Cooperative's own rules, within the rules of the system.

*Alignment:* Structural. The mechanism for changing rules is explicitly designed with a distinction between changeable parameters and unchangeable principles.

### Principle 3: Collective-Choice Arrangements

*Ostrom:* Most users affected by the rules can participate in changing those rules.

*KOLO:* The Upper Kolo — the governing body comprising the Kolo keepers who have activated ZRNO — decides on Protocol rules by quadratic voting (chapter 10). The right to vote derives from recorded contribution — ZRNO is inscribed on the basis of accumulated POEN records, so voting power belongs to Kolo keepers who actively use and contribute to the common good. All users in the system, regardless of status, participate in the decision-making process through initiatives and public discussion before voting. Delegation of votes addresses the participation problem.

*Alignment:* Structural. The right to vote belongs to Kolo keepers, who actively contribute to the common good, while all users take part in discussion — which corresponds to Ostrom examples where active users of the common good vote.

### Principle 4: Monitoring

*Ostrom:* Monitors who actively track the condition of the common good and the behavior of users are accountable to users, or are themselves users.

*KOLO:* The Protocol records every activity in the system — every exchange, every contribution, every act of verification (chapters 6 and 7). The ledger is available to system users in pseudonymous form (chapter 12). Expansion supervisors — Kolo keepers, including the founders — check the legitimacy of verifications (chapter 7). Kolo keepers verify the performance of operational tasks (chapter 8.3). The transparency of rules and the ledger enables every user to detect irregular patterns.

*Alignment:* Structural. Monitoring is automated (the Protocol records everything) and decentralized (Kolo keepers perform the monitoring function). Monitors are themselves system users with recorded contributions.

### Principle 5: Graduated Sanctions

*Ostrom:* Users who violate rules receive sanctions proportional to the severity and context of the violation.

*KOLO:* The system applies sanctions for violations — especially for false verification: annulment of the false verification and of the POEN records that arose from it, compensation charged to the verifier, which may bring their record into a negative value (Art. 20b of the Rulebook on Proof of Reality), and suspension or exclusion, under the procedure set out in the Terms of Use and subject to the right to a complaint (Art. 21 of the Rulebook on Proof of Reality; chapter 7). The compensation is proportionate to what was extracted from the network on the basis of the false verification, and exclusion is a measure imposed as a rule. A verifier who confirms falsely risks their own POEN record and their position in the system (chapter 11). Non-convertibility ensures that internal position is the only thing a user can lose — but for an active user, this is a significant loss.

*Alignment:* Structural. Graduation is explicit and proportional.

### Principle 6: Conflict-Resolution Mechanisms

*Ostrom:* Users have rapid access to mechanisms for resolving disputes.

*KOLO:* Users can submit objections and appeals regarding the functioning of the system to the Foundation (in both phases) and to the Upper Kolo (in Phase 2). The decision-making process in the Upper Kolo includes a period of public discussion in which the entire community can comment on and contest proposals before voting (chapter 10). The four principles of the system, the common-good licenses, and the legal obligations of the Board of Directors absolutely constrain decisions, while the Foundation's protective veto protects its operational and financial sustainability until financial self-sufficiency. A user who disagrees with decisions retains the right to exit the system while exercising the rights set out in chapter 12 (cf. Hirschman, 1970). Concrete procedures for submitting objections and resolving disputes are defined in the system's bylaw.

*Alignment:* Structural. Mechanisms exist at both levels (Foundation and Upper Kolo), with defined procedures in the system's bylaw.

### Principle 7: Minimal Recognition of Rights to Organize

*Ostrom:* An external authority (the state) does not challenge the right of users to establish their own institutions.

*KOLO:* The Foundation is registered under the Law on Endowments and Foundations — the Serbian legal system recognizes the legal form that KOLO uses. The international institutional framework (Appendix A) — the EU Action Plan, UN resolutions, the ILO resolution, the OECD recommendation — actively supports the type of entity in which KOLO functionally fits. Serbia, in the process of EU accession, is entering a regulatory environment that recognizes the social and solidarity economy. The licenses (AGPL-3.0 and CC BY-SA 4.0) protect the common good from appropriation.

*Alignment:* Structural. The legal form is recognized, and the international institutional framework actively supports the category of entity into which KOLO fits.

### Principle 8: Nested Enterprises

*Ostrom:* For larger systems, governance activities are organized in multiple layers of nested structures.

*KOLO:* The system has a multi-layered structure: users → Circles and Cooperatives (collective forms — interest groups, Module 1, and territorial units, Module 2) → Upper Kolo (governing body) → Foundation (legal instrument). Each layer has defined competences. Circles have no legal personality. Cooperatives have full legal personality under the Law on Cooperatives. The Upper Kolo decides on the rules of the entire system. The internationalization module (Module 5) provides for geographic expansion with a unified Protocol.

*Alignment:* Structural in design. The modular architecture provides for nested layers, and its functioning in practice depends on experience with later phases of the system.

### Note on Applicability

The Ostrom principles were formulated on the basis of research into rival common-pool resources — resources whose use by one reduces availability for others. The KOLO system is predominantly a non-rival common good — software, rules, and infrastructure are available to all users without diminution. A rival element exists at the level of ZRNO (one million total; inscribing one reduces those available for others) and at the level of exchange (zero-sum redistribution of POENs). This combination of rival and non-rival elements makes KOLO a hybrid common good — a category that Hess and Ostrom (2007) analyze in the context of digital common goods.

The mapping shows that the KOLO architecture is designed with the aim of addressing all eight principles. The alignment is structural for all eight — the principles are embedded in the Protocol, governance, and legal framework of the system as design decisions, not as retroactive adaptations. Whether the design functions as intended is an empirical question — the answer depends on the experience of operating the system in practice.

