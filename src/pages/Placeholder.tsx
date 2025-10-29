import React from "react"

type PlaceholderProps = {
  title: string
  description?: string
}

export default function Placeholder({ title, description }: PlaceholderProps) {
  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Ini halaman {title}</h1>
        {description ? (
          <p className="mt-2 text-gray-600">{description}</p>
        ) : (
          <p className="mt-2 text-gray-600">Halaman sementara untuk {title}.</p>
        )}
      </div>
    </div>
  )
}

