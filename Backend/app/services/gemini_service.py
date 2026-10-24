import logging
import httpx
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.models.chat import ChatMessage

logger = logging.getLogger("uvicorn")

SYSTEM_PROMPT = """Bạn là 'Pháp Hỷ - Tuệ Giác', trợ lý ảo hướng dẫn viên Phật giáo thông minh và từ ái tại di tích Việt Nam Quốc Tự (244 Ba Tháng Hai, Phường 12, Quận 10, TP.HCM).

Nhiệm vụ của bạn:
1. Thuyết minh, giải thích nguồn gốc lịch sử, giá trị tâm linh và kiến trúc của quần thể Việt Nam Quốc Tự:
   - Lịch sử hình thành: Gắn liền với phong trào tranh đấu bất bạo động bảo vệ Phật giáo năm 1963.
   - Bảo Tháp 13 Tầng: Cao 63 mét, tượng trưng cho 13 tổ chức Phật giáo thống nhất năm 1963. Nơi tôn thờ xá lợi Trái tim Bất diệt của Bồ tát Thích Quảng Đức.
   - Tòa Đại Chánh Điện: Tôn trí đại tượng Đức Phật Bổn Sư Thích Ca Mâu Ni bằng đồng nguyên chất nặng 35 tấn - pho tượng Phật bằng đồng lớn nhất Việt Nam.
   - Tháp Chuông: Quả Đại Hồng Chung nặng gần 3 tấn đúc bằng đồng theo nghệ thuật đúc chuông truyền thống Huế.
   - Nhà Tổ, Phòng Trưng Bày Văn Hóa Phật Giáo, Viện Nghiên Cứu Phật Học, Vườn Lâm Tỳ Ni.
2. Hướng dẫn du khách nghi thức chiêm bái, phép tắc trang nghiêm trong chùa (y phục đoan chính, đi nhẹ nói khẽ, cởi giày dép khi vào Chánh Điện, quy tắc thắp hương bảo vệ môi trường).
3. Chia sẻ những giáo lý Phật giáo căn bản, từ bi, thiền định, buông xả muộn phiền, an lạc thân tâm.
4. Giọng điệu luôn từ tốn, trang nghiêm, khiêm nhường, kính cẩn và tràn đầy hỷ xả. Khi xưng hô, dùng 'Thầy/Tôi' hoặc 'Pháp Hỷ' và gọi người dùng là 'Quý Phật tử' hoặc 'Quý thiện tri thức', 'Quý du khách'."""

FALLBACK_KNOWLEDGE = {
    "bao_thap": "Bảo Tháp 13 Tầng tại Việt Nam Quốc Tự cao 63m, là biểu tượng thiêng liêng tưởng niệm phong trào Phật giáo năm 1963. Con số 13 tượng trưng cho 13 tổ chức, giáo phái Phật giáo cùng chung sức thống nhất. Đặc biệt, bảo tháp là nơi phụng thờ xá lợi Trái tim Bất diệt của Bồ tát Thích Quảng Đức - minh chứng bất hoại cho tinh thần từ bi và lòng quả cảm vị tha.",
    "chanh_dien": "Tòa Đại Chánh Điện là trái tim tâm linh của Việt Nam Quốc Tự. Nơi đây tôn trí pho đại tượng Đức Phật Thích Ca Mâu Ni bằng đồng nguyên chất nặng 35 tấn, cao 7.5m - tác phẩm đúc đồng kỷ lục của Phật giáo Việt Nam. Không gian Chánh Điện được kiến tạo trang nghiêm, kết hợp tinh hoa kiến trúc Phật giáo Bắc tông truyền thống và kết cấu hiện đại.",
    "trai_tim": "Xá lợi Trái tim Bất diệt của Bồ tát Thích Quảng Đức được bảo tồn thiêng liêng tại Việt Nam Quốc Tự. Sau khi ngài tự thiêu ngày 11/6/1963 để bảo vệ Phật pháp và hòa bình, nhục thân của ngài được hỏa thiêu ở nhiệt độ hơn 4000 độ C nhưng trái tim vẫn kết tinh nguyên vẹn, trở thành bảo vật thiêng liêng vô giá.",
    "quy_tac": "Khi đến chiêm bái Việt Nam Quốc Tự, Quý du khách hoan hỷ lưu ý: Mặc trang phục lịch sự, kín đáo; cởi nón mũ và tháo giày dép khi bước vào Chánh Điện; đi nhẹ, nói khẽ, không chụp ảnh tại các khu vực nội thiền tôn nghiêm; và hoan hỷ thắp một nén tâm hương thay vì đốt nhiều nhang đèn để bảo vệ không gian thanh tịnh.",
    "gioi_thieu": "Kính chào Quý du khách và Phật tử! Việt Nam Quốc Tự là trung tâm Phật giáo hàng đầu tại TP.HCM, tọa lạc trên khuôn viên gần 4ha tại đường Ba Tháng Hai, Quận 10. Chùa sở hữu Bảo Tháp 13 tầng hùng vĩ, Tòa Chánh Điện tráng lệ và cảnh quan thanh tịnh. Pháp Hỷ rất vinh hạnh được đồng hành cùng Quý vị trên hành trình chiêm bái hôm nay."
}

class GeminiService:
    @staticmethod
    async def chat(
        message: str,
        language: str = "vi",
        current_poi_id: Optional[str] = None,
        history: Optional[List[ChatMessage]] = None
    ) -> Dict[str, Any]:
        """
        Chat with Buddhist AI Assistant using Gemini 2.5 Flash / ProxyPal,
        with intelligent fallback to grounded knowledge base.
        """
        api_key = settings.PROXYPAL_KEY or settings.GEMINI_API_KEY
        
        # Determine suggested questions based on context
        suggested_vi = [
            "Ý nghĩa lịch sử của Bảo Tháp 13 tầng?",
            "Pho tượng Phật 35 tấn trong Chánh Điện có gì đặc biệt?",
            "Lịch sử Trái tim Bất diệt Bồ tát Thích Quảng Đức?",
            "Nghi thức và quy tắc trang nghiêm khi vào chùa?"
        ]
        suggested_en = [
            "What is the significance of the 13-Storey Stupa?",
            "Tell me about the 35-ton bronze Buddha statue",
            "The story of the immortal heart relic of Thich Quang Duc",
            "Visiting etiquette and dress code at the temple"
        ]
        suggested = suggested_vi if language == "vi" else suggested_en

        # If API key is available, call Gemini 2.5 Flash / ProxyPal
        if api_key:
            try:
                base_url = settings.PROXYPAL_URL.rstrip("/")
                endpoint = f"{base_url}/models/gemini-2.5-flash:generateContent?key={api_key}"
                
                # Format conversation history
                contents = []
                system_instruction = SYSTEM_PROMPT
                if language == "en":
                    system_instruction += "\nPlease respond in English politely, maintaining Buddhist reverence and clarity."

                contents.append({
                    "role": "user",
                    "parts": [{"text": f"System context: {system_instruction}"}]
                })
                contents.append({
                    "role": "model",
                    "parts": [{"text": "Nam Mô Bổn Sư Thích Ca Mâu Ni Phật. Tôi đã hiểu và sẵn sàng đồng hành chiêm bái cùng quý khách." if language == "vi" else "Namo Amitabha Buddha. I am ready to guide you."}]
                })

                if history:
                    for h in history[-6:]:
                        role = "user" if h.role == "user" else "model"
                        contents.append({
                            "role": role,
                            "parts": [{"text": h.content}]
                        })

                user_prompt = message
                if current_poi_id:
                    user_prompt = f"[Vị trí hiện tại của du khách: {current_poi_id}]: {message}"

                contents.append({
                    "role": "user",
                    "parts": [{"text": user_prompt}]
                })

                payload = {
                    "contents": contents,
                    "generationConfig": {
                        "temperature": 0.4,
                        "maxOutputTokens": 800,
                    }
                }

                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(endpoint, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            reply_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                            if reply_text:
                                return {"reply": reply_text.strip(), "suggested_questions": suggested}
                    else:
                        logger.warning(f"Gemini API returned status {resp.status_code}: {resp.text}")
            except Exception as e:
                logger.warning(f"Error querying Gemini API: {e}. Falling back to grounded RAG response.")

        # Grounded Offline Buddhist Knowledge Retrieval Fallback
        msg_lower = message.lower()
        if any(w in msg_lower for w in ["tháp", "13 tầng", "stupa", "tower"]):
            reply = FALLBACK_KNOWLEDGE["bao_thap"]
        elif any(w in msg_lower for w in ["chánh điện", "tượng phật", "35 tấn", "sanctuary", "buddha statue"]):
            reply = FALLBACK_KNOWLEDGE["chanh_dien"]
        elif any(w in msg_lower for w in ["trái tim", "thích quảng đức", "bồ tát", "heart relic"]):
            reply = FALLBACK_KNOWLEDGE["trai_tim"]
        elif any(w in msg_lower for w in ["quy tắc", "trang phục", "lưu ý", "dress code", "etiquette", "nghi thức"]):
            reply = FALLBACK_KNOWLEDGE["quy_tac"]
        else:
            reply = (
                "Nam Mô A Di Đà Phật. " + FALLBACK_KNOWLEDGE["gioi_thieu"]
                if language == "vi" else
                "Welcome to Vietnam Quoc Tu. This historic Buddhist complex represents peace and harmony in Ho Chi Minh City. Feel free to ask about the 13-storey Stupa, 35-ton bronze Buddha, or visiting etiquette."
            )

        return {
            "reply": reply,
            "suggested_questions": suggested
        }

gemini_service = GeminiService()
