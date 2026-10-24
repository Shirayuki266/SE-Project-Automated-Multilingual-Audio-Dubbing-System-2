import httpx
import asyncio

async def test_auth():
    async with httpx.AsyncClient() as client:
        # Test login
        res = await client.post("http://localhost:8000/api/v1/auth/user/login", json={
            "username": "phattu",
            "password": "123456"
        })
        print(f"Login status: {res.status_code}")
        data = res.json()
        token = data.get("access_token")
        print(f"User full_name: {data.get('user', {}).get('full_name')}")
        print(f"Dharma name: {data.get('user', {}).get('dharma_name')}")
        
        # Test get profile
        res_profile = await client.get("http://localhost:8000/api/v1/auth/user/me", headers={
            "Authorization": f"Bearer {token}"
        })
        print(f"Profile status: {res_profile.status_code}")
        print(f"Profile visited POIs count: {len(res_profile.json().get('visited_pois', []))}")

if __name__ == "__main__":
    asyncio.run(test_auth())
