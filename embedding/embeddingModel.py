from InstructorEmbedding import INSTRUCTOR

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from flask import Flask, request, jsonify

app = Flask(__name__)


model = INSTRUCTOR("hkunlp/instructor-large").to("cuda")


@app.route("/api/queryDocument", methods=["POST"])
def queryDocument():
    query = request.json["query"]
    document = request.json["document"]
    query_embeddings = model.encode(query)
    document_embeddings = model.encode(document)
    similarity = cosine_similarity(query_embeddings, document_embeddings)
    retrieval_doc_idx = np.argmax(similarity)
    return jsonify(similarity[0][0])


@app.route("/api/getEmbeddings", methods=["POST"])
def getEmbeddings():
    query = request.json["input"]
    print("Got the input, hang on...")
    query_embeddings = model.encode(query)
    print("Done!")
    return query_embeddings.tolist()


if __name__ == "__main__":
    app.run(debug=True)
