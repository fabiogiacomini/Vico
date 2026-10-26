# 002 — Original-code license and private messaging

Status: **MIT accepted by the owner on 26 October 2026** for Vico original code. `LICENSE` and package metadata record this decision. Cryptographic-library selection and combined-distribution compatibility are still open.

## MIT and AGPL solve different reuse goals

MIT allows broad modification, distribution and commercial reuse, including proprietary derivatives, while preserving its notice. It is suitable if Vico's owner wants that freedom. It does not require derivative services to publish their modifications.

AGPL-3.0 adds copyleft duties, including the source-offer requirement for qualifying network use of modified versions. This supports an objective of keeping modified services open. That objective was proposed by engineering and was not an established owner requirement. Free distribution does not itself require AGPL.

Sources: [MIT text](https://opensource.org/license/mit), [AGPL text](https://www.gnu.org/licenses/agpl-3.0.html).

## Practical comparison for the owner

| Option | Main benefit | Main tradeoff |
| --- | --- | --- |
| MIT | Short, permissive terms support broad reuse, including commercial adoption. Retain the license and copyright notice. | Downstream parties can keep their own modifications proprietary. There is no explicit patent grant comparable to Apache 2.0. |
| Apache-2.0 | Permissive reuse with an explicit, scoped patent grant from contributors and a patent-litigation termination clause. | More notice and change-marking obligations than MIT; still permits proprietary derivatives. |
| AGPL-3.0 | Copyleft requires corresponding source for covered distributions and offers users source for modified versions with which they interact over a network. | More duties for combined works and deployment; integration and mobile distribution terms require review. |

All three allow commercial use. None determines the quality of the encryption or requires that Vico itself charge users. Apache patent terms cover specified contributor claims, not every patent risk. An open source license for code does not make users' chat data public.

Decision: the owner selected MIT after reviewing these tradeoffs. Broad reuse, including proprietary derivatives, is permitted by the chosen license. Apache-2.0 and AGPL-3.0 remain documented alternatives, not selected licenses. Dependency compatibility is a separate engineering gate; cryptographic quality must remain a release requirement.

Additional sources: [Apache 2.0 text](https://www.apache.org/licenses/LICENSE-2.0), [AGPL 3.0 text at OSI](https://opensource.org/license/agpl-3.0).

## The dependency decision is separate

The official [libsignal](https://github.com/signalapp/libsignal) is AGPL-3.0 and warns that external use is unsupported and APIs may change. A MIT header on Vico's original files does not remove obligations from a combined distribution. Before integrating it, review the complete licensing and mobile distribution model, maintenance cost, group membership design and native bridge. Do not relicense libsignal or assume that separating folders resolves compatibility.

The product requires established, reviewed end-to-end protocols, not a new implementation written from published equations. [OpenMLS](https://github.com/openmls/openmls) is another research candidate with a permissive license and a standard group protocol, but it is not a drop-in mobile chat SDK. It has not been selected or integrated. Mobile bindings, persistence, authentication, post-compromise behavior and review evidence must be tested before presenting a recommendation.

## Messaging decision still to make after the security spike

Evaluate reviewed protocol implementations against the approved MIT reuse goals and the product's security requirements. Document integration evidence, native support, remaining risks, maintenance and license obligations. An AGPL dependency is not approved merely because the original files are MIT: if a proposed combined distribution adds copyleft obligations, explain the consequences to the owner before integrating it. Obtain specialist review where necessary; this note is engineering planning, not legal clearance.

No Signal or MLS implementation, crypto transport, cloud relay or group exchange is enabled in this prototype. Do not claim that an outing stored using SQLCipher is an encrypted group chat.
