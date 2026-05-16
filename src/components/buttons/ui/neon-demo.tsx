import { Button } from "@/components/ui/neon-button"

const Default = () => {
    return (
        <div className="p-8 bg-charcoal-dark min-h-screen">
            <div className="flex flex-col gap-6 max-w-xs mx-auto">
                <p className="text-white/40 text-micro font-bold tracking-tight text-center mb-4">Button showcase</p>
                
                <div className="space-y-2">
                    <p className="text-white/20 text-micro tracking-tight text-center">Default neon</p>
                    <Button>Movement Insights</Button>
                </div>

                <div className="space-y-2">
                    <p className="text-white/20 text-micro tracking-tight text-center">Solid variant</p>
                    <Button variant="solid">Join The Base</Button>
                </div>

                <div className="space-y-2">
                    <p className="text-white/20 text-micro tracking-tight text-center">Gold variant</p>
                    <Button variant="gold">Support Progress</Button>
                </div>

                <div className="space-y-2">
                    <p className="text-white/20 text-micro tracking-tight text-center">No neon</p>
                    <Button neon={false}>Static Action</Button>
                </div>

                <div className="space-y-2">
                    <p className="text-white/20 text-micro tracking-tight text-center">Ghost variant</p>
                    <Button variant="ghost">Secondary Info</Button>
                </div>
            </div>
        </div>
    )
}

const WithNoNeon = () => {
    return (
        <div className="flex flex-col gap-2">
            <Button neon={false}>normal button</Button>
        </div>
    )
}

const Solid = () => {
    return (
        <div className="flex flex-col gap-2">
            <Button variant={"solid"}>solid</Button>
        </div>
    )
}

export { Default, WithNoNeon, Solid }
