from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import json

class EmbeddingService:
    def __init__(self):
        self.model = SentenceTransformer("all-MiniLM-L6-v2")
        self.index = None
        self.sop_data = []

    def load_data(self):
        with open("app/data/sop_dataset.json", "r") as f:
            self.sop_data = json.load(f)

    def create_embeddings(self):
        texts = [
            " ".join(
                item["immediate_actions"] +
                item["reporting_steps"] +
                item["keywords"]
            )
            for item in self.sop_data
        ]

        embeddings = self.model.encode(texts)
        dimension = embeddings.shape[1]

        self.index = faiss.IndexFlatL2(dimension)
        self.index.add(np.array(embeddings).astype("float32"))

    def search(self, query):
        query_vector = self.model.encode([query])
        distances, indices = self.index.search(
            np.array(query_vector).astype("float32"), k=1
        )
        return self.sop_data[indices[0][0]]
