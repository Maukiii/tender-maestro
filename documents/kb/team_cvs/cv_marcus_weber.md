# Marcus Weber
**Data Scientist — NLP & Machine Learning**  
Meridian Intelligence GmbH, Berlin  
m.weber@meridian-intelligence.eu | +49 30 884 2224

---

## Professional Summary

Applied data scientist specialising in natural language processing, entity classification, and large-scale text analysis. Joined Meridian in 2021. Responsible for the design and maintenance of Meridian's NLP classification pipeline — the core engine that determines which organisations are relevant to a given market scope based on their web content. Particular expertise in fine-tuning transformer-based models for domain-specific classification tasks in German and English. Background in computational linguistics and applied ML research.

---

## Education

**M.Sc. in Computational Linguistics** — Ludwig-Maximilians-Universität München (2020)  
Thesis: *Domain adaptation for low-resource entity classification using web-scraped training data*  
Graduated with distinction

**B.Sc. in Informatics** — Technische Universität München (2018)

---

## Professional Experience

### Data Scientist — Meridian Intelligence GmbH, Berlin
*2021 – present*

Owns the NLP and classification layer of Meridian's WebMap pipeline. Core responsibilities:
- Design and training of multi-label text classifiers for organisational scope determination (currently in deployment: cybersecurity, data economy, AI/ML, fintech, industrial deep tech classifiers)
- Entity resolution: hybrid blocking + embedding-based deduplication system processing 10M+ records
- Model evaluation: stratified hold-out validation, false-positive auditing, quarterly retraining cycles
- Research on classifier adaptation to new project scopes: typical time-to-deployment for a new domain classifier is 3–4 weeks

Notable technical contributions at Meridian:
- Reduced WebMap classification latency by 60% by replacing spaCy rule-based pipelines with fine-tuned sentence-BERT models (2022)
- Developed a cross-lingual entity matching module enabling reliable deduplication across 23 EU language variants (2023)
- Built the AI involvement indicator introduced in JRC Phase III — a continuous score for AI-product-or-service relevance derived from web content, validated against a manually annotated sample of 4,200 companies (2024)

### ML Research Assistant — Fraunhofer IAIS, Sankt Augustin
*2020 – 2021*

Contributed to a research project on automated knowledge graph construction from scientific literature. Developed named entity recognition models for scientific entity types (methods, datasets, metrics). Co-authored one peer-reviewed paper.

---

## Technical Skills

**Languages:** Python (expert), SQL (advanced), R (intermediate)  
**NLP/ML:** PyTorch, Transformers (Hugging Face), spaCy, scikit-learn, sentence-transformers, NLTK  
**Data infrastructure:** PostgreSQL, Elasticsearch, Apache Airflow, Docker  
**Cloud:** AWS (SageMaker, S3, Lambda)  
**Evaluation:** MLflow, Weights & Biases, custom hold-out validation frameworks

---

## Selected Model Performance (Internal Benchmarks)

| Classifier | Task | Precision | Recall | F1 |
|---|---|---|---|---|
| Cybersecurity relevance | Binary, 27-language | 0.89 | 0.84 | 0.87 |
| Data economy involvement | Multi-label, EN+DE | 0.91 | 0.86 | 0.88 |
| AI product/service signal | Binary, EN+DE | 0.88 | 0.82 | 0.85 |
| FinTech / DORA ICT provider | Multi-class, EN | 0.87 | 0.83 | 0.85 |

*Evaluation on stratified 20% hold-out sets, not seen during training.*

---

## Publication

Weber, M. & Schuster, J. (2021). "Semi-supervised named entity recognition for scientific text using weak supervision." *Proceedings of EMNLP 2021 Workshop on Scientific Document Understanding*, 88–96.

---

## Languages
German (native), English (fluent)

---

## Role in Proposed Project
Data Science Lead. Responsible for classifier development and maintenance, entity resolution, model evaluation, and any AI/ML technical deliverables. Works directly under Thomas Vogel's technical oversight.
