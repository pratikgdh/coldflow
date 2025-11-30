import { Cards } from 'nextra/components'

interface OverviewBoxesProps {
  title: string
  description: string
  href: string
  icon: React.ReactElement
}

export const OverviewBoxes = ({ boxes }: { boxes: OverviewBoxesProps[] }) => {
    return (
      <Cards>
        {boxes.map(item => {
          return (
            <Cards.Card
              key={item.title}
              title={item.title}
              icon={item.icon}
              href={item.href}
            />
          )
        })}
      </Cards>
    )
}