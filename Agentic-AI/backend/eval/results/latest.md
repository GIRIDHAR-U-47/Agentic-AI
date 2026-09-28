# Research Pilot evaluation

- generated_at: 2026-09-28T10:56:32
- corpus: 10 documents, 7 questions, modes: no_rag, basic_rag, agentic_rag

| question | mode | provider | status | cite | support | fact_recall | r_prec | latency_s | verified | consistent |
|---|---|---|---|---|---|---|---|---|---|---|
| patchtst_channel_independence | no_rag | offline | ran | 0 | 0.00 | 0.0 | 0.0 | 0.00 | False | - |
| patchtst_channel_independence | no_rag | openrouter | PENDING | - | - | - | - | - | - | - |
| patchtst_channel_independence | no_rag | openrouter-strong | PENDING | - | - | - | - | - | - | - |
| patchtst_channel_independence | basic_rag | offline | ran | 4 | 1.00 | 0.0 | 0.5 | 0.05 | True | - |
| patchtst_channel_independence | basic_rag | openrouter | PENDING | - | - | - | - | - | - | - |
| patchtst_channel_independence | basic_rag | openrouter-strong | PENDING | - | - | - | - | - | - | - |
| patchtst_channel_independence | agentic_rag | offline | ran | 2 | 1.00 | 0.0 | 1.0 | 0.79 | True | 1.0 |
| patchtst_channel_independence | agentic_rag | openrouter | PENDING | - | - | - | - | - | - | - |
| patchtst_channel_independence | agentic_rag | openrouter-strong | PENDING | - | - | - | - | - | - | - |
| transformer_limits_ltsf | no_rag | offline | ran | 0 | 0.00 | 0.0 | 0.0 | 0.00 | False | - |
| transformer_limits_ltsf | no_rag | openrouter | PENDING | - | - | - | - | - | - | - |
| transformer_limits_ltsf | no_rag | openrouter-strong | PENDING | - | - | - | - | - | - | - |
| transformer_limits_ltsf | basic_rag | offline | ran | 5 | 1.00 | 0.0 | 0.0 | 0.05 | True | - |
| transformer_limits_ltsf | basic_rag | openrouter | PENDING | - | - | - | - | - | - | - |
| transformer_limits_ltsf | basic_rag | openrouter-strong | PENDING | - | - | - | - | - | - | - |
| transformer_limits_ltsf | agentic_rag | offline | ran | 3 | 0.75 | 0.0 | 0.0 | 0.07 | False | 1.0 |
| transformer_limits_ltsf | agentic_rag | openrouter | PENDING | - | - | - | - | - | - | - |
| transformer_limits_ltsf | agentic_rag | openrouter-strong | PENDING | - | - | - | - | - | - | - |
| autoformer_decomposition | no_rag | offline | ran | 0 | 0.00 | 0.0 | 0.0 | 0.00 | False | - |
| autoformer_decomposition | no_rag | openrouter | PENDING | - | - | - | - | - | - | - |
| autoformer_decomposition | no_rag | openrouter-strong | PENDING | - | - | - | - | - | - | - |
| autoformer_decomposition | basic_rag | offline | ran | 4 | 1.00 | 0.0 | 0.3333 | 0.11 | True | - |
| autoformer_decomposition | basic_rag | openrouter | PENDING | - | - | - | - | - | - | - |
| autoformer_decomposition | basic_rag | openrouter-strong | PENDING | - | - | - | - | - | - | - |
| autoformer_decomposition | agentic_rag | offline | ran | 3 | 1.00 | 0.0 | 0.0 | 0.07 | True | 1.0 |
| autoformer_decomposition | agentic_rag | openrouter | PENDING | - | - | - | - | - | - | - |
| autoformer_decomposition | agentic_rag | openrouter-strong | PENDING | - | - | - | - | - | - | - |
| informer_efficiency | no_rag | offline | ran | 0 | 0.00 | 0.0 | 0.0 | 0.00 | False | - |
| informer_efficiency | no_rag | openrouter | PENDING | - | - | - | - | - | - | - |
| informer_efficiency | no_rag | openrouter-strong | PENDING | - | - | - | - | - | - | - |
| informer_efficiency | basic_rag | offline | ran | 5 | 1.00 | 0.3333 | 0.25 | 0.05 | True | - |
| informer_efficiency | basic_rag | openrouter | PENDING | - | - | - | - | - | - | - |
| informer_efficiency | basic_rag | openrouter-strong | PENDING | - | - | - | - | - | - | - |
| informer_efficiency | agentic_rag | offline | ran | 5 | 0.83 | 0.3333 | 0.25 | 0.07 | False | 1.0 |
| informer_efficiency | agentic_rag | openrouter | PENDING | - | - | - | - | - | - | - |
| informer_efficiency | agentic_rag | openrouter-strong | PENDING | - | - | - | - | - | - | - |
| itransformer_inversion | no_rag | offline | ran | 0 | 0.00 | 0.0 | 0.0 | 0.00 | False | - |
| itransformer_inversion | no_rag | openrouter | PENDING | - | - | - | - | - | - | - |
| itransformer_inversion | no_rag | openrouter-strong | PENDING | - | - | - | - | - | - | - |
| itransformer_inversion | basic_rag | offline | ran | 4 | 1.00 | 0.0 | 0.5 | 0.08 | True | - |
| itransformer_inversion | basic_rag | openrouter | PENDING | - | - | - | - | - | - | - |
| itransformer_inversion | basic_rag | openrouter-strong | PENDING | - | - | - | - | - | - | - |
| itransformer_inversion | agentic_rag | offline | ran | 2 | 0.80 | 0.0 | 0.5 | 0.12 | False | 1.0 |
| itransformer_inversion | agentic_rag | openrouter | PENDING | - | - | - | - | - | - | - |
| itransformer_inversion | agentic_rag | openrouter-strong | PENDING | - | - | - | - | - | - | - |
| cross_model_forecasting | no_rag | offline | ran | 0 | 0.00 | 0.0 | 0.0 | 0.00 | False | - |
| cross_model_forecasting | no_rag | openrouter | PENDING | - | - | - | - | - | - | - |
| cross_model_forecasting | no_rag | openrouter-strong | PENDING | - | - | - | - | - | - | - |
| cross_model_forecasting | basic_rag | offline | ran | 5 | 1.00 | 0.0 | 0.5 | 0.09 | True | - |
| cross_model_forecasting | basic_rag | openrouter | PENDING | - | - | - | - | - | - | - |
| cross_model_forecasting | basic_rag | openrouter-strong | PENDING | - | - | - | - | - | - | - |
| cross_model_forecasting | agentic_rag | offline | ran | 5 | 1.00 | 0.0 | 0.5 | 0.12 | True | 1.0 |
| cross_model_forecasting | agentic_rag | openrouter | PENDING | - | - | - | - | - | - | - |
| cross_model_forecasting | agentic_rag | openrouter-strong | PENDING | - | - | - | - | - | - | - |
| out_of_scope_qcd | no_rag | offline | ran | 0 | 0.00 | - | 0.0 | 0.00 | False | - |
| out_of_scope_qcd | no_rag | openrouter | PENDING | - | - | - | - | - | - | - |
| out_of_scope_qcd | no_rag | openrouter-strong | PENDING | - | - | - | - | - | - | - |
| out_of_scope_qcd | basic_rag | offline | ran | 0 | 0.00 | - | 0.0 | 0.09 | False | - |
| out_of_scope_qcd | basic_rag | openrouter | PENDING | - | - | - | - | - | - | - |
| out_of_scope_qcd | basic_rag | openrouter-strong | PENDING | - | - | - | - | - | - | - |
| out_of_scope_qcd | agentic_rag | offline | ran | 0 | 0.00 | - | 0.0 | 0.28 | False | 1.0 |
| out_of_scope_qcd | agentic_rag | openrouter | PENDING | - | - | - | - | - | - | - |
| out_of_scope_qcd | agentic_rag | openrouter-strong | PENDING | - | - | - | - | - | - | - |

cross-LLM consistency: PENDING (need >= 2 keyed providers; only offline present)