import { registerEnumType } from "@nestjs/graphql";
import { PackagingUnit } from "@/modules/catalog/domain/enums/packaging-unit.enum";
import { ProductKind } from "@/modules/catalog/domain/enums/product-kind.enum";
import { UnitOfMeasure } from "@/modules/catalog/domain/enums/unit-of-measure.enum";

registerEnumType(UnitOfMeasure, { name: "UnitOfMeasure" });
registerEnumType(ProductKind, { name: "ProductKind" });
registerEnumType(PackagingUnit, { name: "PackagingUnit" });
