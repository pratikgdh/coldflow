import { authClient } from '@/access/authClient'

export default async function AuthPage() {
    const { data, error } = await authClient.signIn.email({
        email: 'test@test.com',
        password: 'test',
    })
    return <div>{JSON.stringify(data)}</div>
}