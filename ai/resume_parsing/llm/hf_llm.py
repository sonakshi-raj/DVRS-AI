import os
from huggingface_hub import InferenceClient


class HuggingFaceLLM:
    def __init__(
        self,
        model: str = "meta-llama/Meta-Llama-3-8B-Instruct",
        max_tokens: int = 5500,
    ):
        token = os.getenv("HUGGINGFACEHUB_API_TOKEN")
        if not token:
            raise RuntimeError("HUGGINGFACEHUB_API_TOKEN not set")

        self.client = InferenceClient(
            model=model,
            token=token,
        )
        self.max_tokens = max_tokens

    def invoke(self, prompt: str):
        response = self.client.chat_completion(
            messages=[
                {"role": "user", "content": prompt}
            ],
            max_tokens=self.max_tokens,
            temperature=0.0,
            top_p=1.0,
        )

        return type(
            "LLMResponse",
            (),
            {"content": response.choices[0].message["content"]}
        )
  
